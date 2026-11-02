const { ObjectId } = require('mongodb');
const viajesRepository = require('../repositories/viajes.repository');
const camionesRepository = require('../repositories/camiones.repository');
const choferesRepository = require('../repositories/choferes.repository');

const ESTADOS_VIAJE_VALIDOS = ['en_curso', 'finalizado', 'cancelado'];

class ViajesService {
  async listarViajes(estadoQuery, skipQuery, limitQuery) {
    const filter = {};
    if (estadoQuery !== undefined) {
      const estadoSanitizado = String(estadoQuery).trim();
      if (!ESTADOS_VIAJE_VALIDOS.includes(estadoSanitizado)) {
        const error = new Error(`Filtro de estado inválido '${estadoSanitizado}'. Permitidos: ${ESTADOS_VIAJE_VALIDOS.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
      filter.estado = estadoSanitizado;
    }

    let limit = 50;
    if (limitQuery !== undefined) {
      const parsedLimit = Number(limitQuery);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        const error = new Error("El parámetro 'limit' debe ser un número entero positivo");
        error.statusCode = 400;
        throw error;
      }
      limit = Math.min(parsedLimit, 100);
    }

    let skip = 0;
    if (skipQuery !== undefined) {
      const parsedSkip = Number(skipQuery);
      if (isNaN(parsedSkip) || parsedSkip < 0) {
        const error = new Error("El parámetro 'skip' debe ser un número mayor o igual a 0");
        error.statusCode = 400;
        throw error;
      }
      skip = parsedSkip;
    }

    return viajesRepository.findWithFilter(filter, skip, limit);
  }

  async despacharViaje(payload) {
    const { camion_patente, chofer_dni, origen, destino, carga_descripcion, peso_kg, km_salida } = payload;
    if (!camion_patente || !chofer_dni || !origen || !destino || !carga_descripcion || !peso_kg) {
      const error = new Error('Faltan parámetros del viaje');
      error.statusCode = 400;
      throw error;
    }

    const patenteUpper = String(camion_patente).trim().toUpperCase();
    const dniStr = String(chofer_dni).trim();
    const pesoNum = Number(peso_kg);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      const error = new Error('peso_kg debe ser un número positivo');
      error.statusCode = 400;
      throw error;
    }

    const camionExiste = await camionesRepository.findByPatente(patenteUpper);
    if (!camionExiste) {
      const error = new Error(`Camión con patente '${patenteUpper}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    const choferExiste = await choferesRepository.findByDni(dniStr);
    if (!choferExiste) {
      const error = new Error(`Chofer con DNI '${dniStr}' no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    if (pesoNum > camionExiste.capacidad_kg) {
      const error = new Error(`Sobrecarga: El peso (${pesoNum} kg) supera la capacidad máxima (${camionExiste.capacidad_kg} kg)`);
      error.statusCode = 400;
      throw error;
    }

    const camionReservado = await camionesRepository.reserveAtomic(patenteUpper, pesoNum);
    if (!camionReservado) {
      const error = new Error(`El camión ${patenteUpper} no está disponible, no soporta la carga requerida o fue asignado en concurrencia`);
      error.statusCode = 409;
      throw error;
    }

    const choferReservado = await choferesRepository.reserveAtomic(dniStr);
    if (!choferReservado) {
      await camionesRepository.setEstado(patenteUpper, 'disponible');
      const error = new Error(`El chofer con DNI ${dniStr} no está disponible o ya fue asignado en concurrencia`);
      error.statusCode = 409;
      throw error;
    }

    try {
      const salidaKm = km_salida !== undefined && km_salida !== null
        ? Number(km_salida)
        : Number(camionReservado.kilometraje_actual);

      if (isNaN(salidaKm) || salidaKm < 0) {
        await camionesRepository.setEstado(patenteUpper, 'disponible');
        await choferesRepository.releaseAtomic(dniStr);
        const error = new Error('km_salida debe ser un número válido mayor o igual a 0');
        error.statusCode = 400;
        throw error;
      }

      const docViaje = {
        camion_patente: camionReservado.patente,
        chofer_dni: choferReservado.dni,
        chofer_nombre: choferReservado.nombre,
        origen: String(origen).trim(),
        destino: String(destino).trim(),
        carga_descripcion: String(carga_descripcion).trim(),
        peso_kg: pesoNum,
        km_salida: salidaKm,
        km_llegada: null,
        km_recorridos: 0,
        estado: 'en_curso',
        fecha_salida: new Date(),
        fecha_llegada: null,
        observaciones: ''
      };

      return await viajesRepository.insert(docViaje);
    } catch (err) {
      await camionesRepository.setEstado(patenteUpper, 'disponible');
      await choferesRepository.releaseAtomic(dniStr);
      throw err;
    }
  }

  async finalizarViaje(id, payload) {
    const { km_llegada, observaciones } = payload;

    if (!ObjectId.isValid(id)) {
      const error = new Error(`El identificador de viaje '${id}' no es un ObjectId válido de MongoDB.`);
      error.statusCode = 400;
      throw error;
    }

    if (!km_llegada) {
      const error = new Error('km_llegada es requerido para finalizar el viaje');
      error.statusCode = 400;
      throw error;
    }

    const viaje = await viajesRepository.findById(id);
    if (!viaje) {
      const error = new Error('Viaje no encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (viaje.estado !== 'en_curso') {
      const error = new Error(`El viaje ya está en estado: ${viaje.estado}`);
      error.statusCode = 400;
      throw error;
    }

    const kmFin = Number(km_llegada);
    if (kmFin < viaje.km_salida) {
      const error = new Error('El kilometraje de llegada no puede ser menor al de salida');
      error.statusCode = 400;
      throw error;
    }

    const kmRecorridos = kmFin - viaje.km_salida;

    await viajesRepository.updateFinalizar(id, {
      estado: 'finalizado',
      km_llegada: kmFin,
      km_recorridos: kmRecorridos,
      fecha_llegada: new Date(),
      observaciones: observaciones !== undefined && observaciones !== null ? String(observaciones).trim() : ''
    });

    await camionesRepository.releaseAtomic(viaje.camion_patente, kmFin);
    await choferesRepository.releaseAtomic(viaje.chofer_dni);

    return { success: true, viaje_id: id, km_recorridos: kmRecorridos };
  }
}

module.exports = new ViajesService();
