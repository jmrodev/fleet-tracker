const camionesRepository = require('../repositories/camiones.repository');

const ESTADOS_CAMION_VALIDOS = ['disponible', 'en_mantenimiento', 'en_viaje'];

class CamionesService {
  async listarCamiones(estadoQuery, skipQuery, limitQuery) {
    const filter = {};
    if (estadoQuery !== undefined) {
      const estadoSanitizado = String(estadoQuery).trim();
      if (!ESTADOS_CAMION_VALIDOS.includes(estadoSanitizado)) {
        const error = new Error(`Filtro de estado inválido '${estadoSanitizado}'. Permitidos: ${ESTADOS_CAMION_VALIDOS.join(', ')}`);
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

    return camionesRepository.findWithFilter(filter, skip, limit);
  }

  async obtenerCamion(patente) {
    const patenteUpper = String(patente).trim().toUpperCase();
    const camion = await camionesRepository.findByPatente(patenteUpper);
    if (!camion) {
      const error = new Error(`Camión con patente '${patenteUpper}' no encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return camion;
  }

  async crearCamion(payload) {
    const { patente, marca, modelo, anio, capacidad_kg, kilometraje_actual, foto_url } = payload;
    if (!patente || !marca || !modelo || !anio || !capacidad_kg || kilometraje_actual === undefined) {
      const error = new Error('patente, marca, modelo, anio, capacidad_kg y kilometraje_actual son obligatorios');
      error.statusCode = 400;
      throw error;
    }

    const patenteLimpia = String(patente).trim().toUpperCase();
    if (patenteLimpia.length === 0) {
      const error = new Error('La patente no puede estar vacía');
      error.statusCode = 400;
      throw error;
    }

    const patenteRegex = /^[A-Z0-9]+$/;
    if (!patenteRegex.test(patenteLimpia)) {
      const error = new Error('Formato de patente inválido. Solo debe contener caracteres alfanuméricos.');
      error.statusCode = 400;
      throw error;
    }

    const anioParsed = Number(anio);
    const anioActual = new Date().getFullYear();
    if (isNaN(anioParsed) || anioParsed < 1950 || anioParsed > anioActual + 1) {
      const error = new Error(`El anio del camión debe ser un número válido entre 1950 y ${anioActual + 1}`);
      error.statusCode = 400;
      throw error;
    }

    const capacidadParsed = Number(capacidad_kg);
    if (isNaN(capacidadParsed) || capacidadParsed <= 0) {
      const error = new Error('capacidad_kg debe ser un número estrictamente mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    const kmParsed = Number(kilometraje_actual);
    if (isNaN(kmParsed) || kmParsed < 0) {
      const error = new Error('kilometraje_actual debe ser un número mayor o igual a 0');
      error.statusCode = 400;
      throw error;
    }

    const doc = {
      patente: patenteLimpia,
      marca: String(marca).trim(),
      modelo: String(modelo).trim(),
      anio: anioParsed,
      capacidad_kg: capacidadParsed,
      kilometraje_actual: kmParsed,
      foto_url: foto_url !== undefined && foto_url !== null ? String(foto_url).trim() : '',
      estado: 'disponible',
      mantenimientos: [],
      creado_en: new Date()
    };

    try {
      return await camionesRepository.insert(doc);
    } catch (err) {
      if (err.code === 11000) {
        const error = new Error(`La patente '${doc.patente}' ya está registrada (índice único).`);
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  async actualizarCamion(patente, payload) {
    const patenteUpper = String(patente).trim().toUpperCase();
    const { marca, modelo, anio, capacidad_kg, kilometraje_actual, estado, foto_url } = payload;

    const fieldsToSet = {};
    if (marca !== undefined) fieldsToSet.marca = String(marca).trim();
    if (modelo !== undefined) fieldsToSet.modelo = String(modelo).trim();
    if (anio !== undefined) fieldsToSet.anio = Number(anio);
    if (capacidad_kg !== undefined) fieldsToSet.capacidad_kg = Number(capacidad_kg);
    if (kilometraje_actual !== undefined) {
      const kmNum = Number(kilometraje_actual);
      if (isNaN(kmNum) || kmNum < 0) {
        const error = new Error('kilometraje_actual debe ser un número mayor o igual a 0');
        error.statusCode = 400;
        throw error;
      }
      fieldsToSet.kilometraje_actual = kmNum;
    }
    if (estado !== undefined) {
      const estadoStr = String(estado).trim();
      if (!ESTADOS_CAMION_VALIDOS.includes(estadoStr)) {
        const error = new Error(`Estado inválido '${estadoStr}'. Estados permitidos: ${ESTADOS_CAMION_VALIDOS.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
      fieldsToSet.estado = estadoStr;
    }
    if (foto_url !== undefined) fieldsToSet.foto_url = String(foto_url).trim();

    if (Object.keys(fieldsToSet).length === 0) {
      const error = new Error('No se enviaron campos válidos para actualizar');
      error.statusCode = 400;
      throw error;
    }

    const updated = await camionesRepository.updateFields(patenteUpper, fieldsToSet);
    if (!updated) {
      const error = new Error(`Camión con patente '${patenteUpper}' no encontrado.`);
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  async eliminarCamion(patente) {
    const patenteUpper = String(patente).trim().toUpperCase();
    const camion = await camionesRepository.findByPatente(patenteUpper);
    if (!camion) {
      const error = new Error(`Camión con patente '${patenteUpper}' no encontrado.`);
      error.statusCode = 404;
      throw error;
    }

    if (camion.estado === 'en_viaje') {
      const error = new Error(`No se puede eliminar la unidad ${patenteUpper} porque está en viaje activo.`);
      error.statusCode = 400;
      throw error;
    }

    await camionesRepository.deleteByPatente(patenteUpper);
    return { success: true, message: `Camión ${patenteUpper} eliminado correctamente.` };
  }

  async registrarMantenimiento(patente, payload) {
    const { ObjectId } = require('mongodb');
    const patenteUpper = String(patente).trim().toUpperCase();
    const { tipo, taller, costo, km_servicio, detalles, cambiar_estado } = payload;

    if (!tipo || !taller || costo === undefined || km_servicio === undefined) {
      const error = new Error('tipo, taller, costo y km_servicio son obligatorios');
      error.statusCode = 400;
      throw error;
    }

    const costoParsed = Number(costo);
    if (isNaN(costoParsed) || costoParsed < 0) {
      const error = new Error('costo debe ser un número mayor o igual a 0');
      error.statusCode = 400;
      throw error;
    }

    const kmServParsed = Number(km_servicio);
    if (isNaN(kmServParsed) || kmServParsed < 0) {
      const error = new Error('km_servicio debe ser un número mayor o igual a 0');
      error.statusCode = 400;
      throw error;
    }

    let nuevoEstado;
    if (cambiar_estado !== undefined) {
      const estadoStr = String(cambiar_estado).trim();
      if (!ESTADOS_CAMION_VALIDOS.includes(estadoStr)) {
        const error = new Error(`Estado inválido '${estadoStr}'. Permitidos: ${ESTADOS_CAMION_VALIDOS.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }
      nuevoEstado = estadoStr;
    }

    const registro = {
      id: new ObjectId().toString(),
      tipo: String(tipo).trim(),
      taller: String(taller).trim(),
      costo: costoParsed,
      km_servicio: kmServParsed,
      detalles: detalles !== undefined && detalles !== null ? String(detalles).trim() : '',
      fecha: new Date()
    };

    const result = await camionesRepository.pushMantenimiento(patenteUpper, registro, nuevoEstado);
    if (result.matchedCount === 0) {
      const error = new Error(`Camión con patente ${patenteUpper} no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    return { success: true, mantenimiento: registro };
  }
}

module.exports = new CamionesService();
