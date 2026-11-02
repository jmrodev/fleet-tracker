const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

const ESTADOS_VIAJE_VALIDOS = ['en_curso', 'finalizado', 'cancelado'];

// Listar viajes (con paginación defensiva y sanitización de filtros)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.estado !== undefined) {
      const estadoSanitizado = String(req.query.estado).trim();
      if (!ESTADOS_VIAJE_VALIDOS.includes(estadoSanitizado)) {
        return res.status(400).json({ 
          error: `Filtro de estado inválido '${estadoSanitizado}'. Permitidos: ${ESTADOS_VIAJE_VALIDOS.join(', ')}` 
        });
      }
      filter.estado = estadoSanitizado;
    }
    let limit = 50;
    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({ error: "El parámetro 'limit' debe ser un número entero positivo" });
      }
      limit = Math.min(parsedLimit, 100);
    }

    let skip = 0;
    if (req.query.skip !== undefined) {
      const parsedSkip = Number(req.query.skip);
      if (isNaN(parsedSkip) || parsedSkip < 0) {
        return res.status(400).json({ error: "El parámetro 'skip' debe ser un número mayor o igual a 0" });
      }
      skip = parsedSkip;
    }

    const viajes = await db.collection('viajes')
      .find(filter)
      .sort({ fecha_salida: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    res.json(viajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Despachar nuevo viaje (Reserva atómica en MongoDB con chequeo de capacidad en motor)
router.post('/', async (req, res) => {
  const db = getDB();
  const { camion_patente, chofer_dni, origen, destino, carga_descripcion, peso_kg, km_salida } = req.body;
  if (!camion_patente || !chofer_dni || !origen || !destino || !carga_descripcion || !peso_kg) {
    return res.status(400).json({ error: 'Faltan parámetros del viaje' });
  }

  const patenteUpper = camion_patente.toUpperCase();
  const dniStr = String(chofer_dni).trim();
  const pesoNum = Number(peso_kg);
  if (isNaN(pesoNum) || pesoNum <= 0) {
    return res.status(400).json({ error: 'peso_kg debe ser un número positivo' });
  }

  // 1. Verificación de existencia base del camión para dar mensaje descriptivo si no existe
  const camionExiste = await db.collection('camiones').findOne({ patente: patenteUpper });
  if (!camionExiste) {
    return res.status(404).json({ error: `Camión con patente '${patenteUpper}' no encontrado` });
  }
  if (pesoNum > camionExiste.capacidad_kg) {
    return res.status(400).json({ 
      error: `Sobrecarga: El peso (${pesoNum} kg) supera la capacidad máxima (${camionExiste.capacidad_kg} kg)` 
    });
  }

  // 2. Reserva atómica del camión incluyendo invariante de capacidad directamente en el filtro CAS
  const camionReservado = await db.collection('camiones').findOneAndUpdate(
    { patente: patenteUpper, estado: 'disponible', capacidad_kg: { $gte: pesoNum } },
    { $set: { estado: 'en_viaje' } },
    { returnDocument: 'after' }
  );

  if (!camionReservado) {
    return res.status(409).json({ 
      error: `El camión ${patenteUpper} no está disponible, no soporta la carga requerida o fue asignado en concurrencia` 
    });
  }

  // 3. Reserva atómica del chofer (Compare-and-Swap atómico a nivel motor)
  const choferReservado = await db.collection('choferes').findOneAndUpdate(
    { dni: dniStr, estado: 'disponible' },
    { $set: { estado: 'asignado' } },
    { returnDocument: 'after' }
  );

  if (!choferReservado) {
    // Rollback de la reserva del camión si el chofer no está disponible
    await db.collection('camiones').updateOne({ patente: patenteUpper }, { $set: { estado: 'disponible' } });
    return res.status(409).json({ error: `El chofer con DNI ${dniStr} no está disponible o ya fue asignado en concurrencia` });
  }

  try {
    const salidaKm = km_salida !== undefined && km_salida !== null
      ? Number(km_salida)
      : Number(camionReservado.kilometraje_actual);

    if (isNaN(salidaKm) || salidaKm < 0) {
      // Rollback de reservas en caso de odómetro inválido
      await db.collection('camiones').updateOne({ patente: patenteUpper }, { $set: { estado: 'disponible' } });
      await db.collection('choferes').updateOne({ dni: dniStr }, { $set: { estado: 'disponible' } });
      return res.status(400).json({ error: 'km_salida debe ser un número válido mayor o igual a 0' });
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

    const result = await db.collection('viajes').insertOne(docViaje);
    res.status(201).json({ _id: result.insertedId, ...docViaje });
  } catch (err) {
    // Rollback en caso de falla de persistencia del viaje
    await db.collection('camiones').updateOne({ patente: patenteUpper }, { $set: { estado: 'disponible' } });
    await db.collection('choferes').updateOne({ dni: dniStr }, { $set: { estado: 'disponible' } });
    res.status(500).json({ error: err.message });
  }
});

// Finalizar viaje y asentar odometría
router.put('/:id/finalizar', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { km_llegada, observaciones } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: `El identificador de viaje '${id}' no es un ObjectId válido de MongoDB.` });
    }

    if (!km_llegada) {
      return res.status(400).json({ error: 'km_llegada es requerido para finalizar el viaje' });
    }

    const viaje = await db.collection('viajes').findOne({ _id: new ObjectId(id) });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
    if (viaje.estado !== 'en_curso') {
      return res.status(400).json({ error: `El viaje ya está en estado: ${viaje.estado}` });
    }

    const kmFin = Number(km_llegada);
    if (kmFin < viaje.km_salida) {
      return res.status(400).json({ error: 'El kilometraje de llegada no puede ser menor al de salida' });
    }

    const kmRecorridos = kmFin - viaje.km_salida;

    await db.collection('viajes').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          estado: 'finalizado',
          km_llegada: kmFin,
          km_recorridos: kmRecorridos,
          fecha_llegada: new Date(),
          observaciones: observaciones !== undefined && observaciones !== null ? String(observaciones).trim() : ''
        }
      }
    );

    // Liberar recursos y actualizar odómetro del camión con invariante monótono ($max)
    await db.collection('camiones').updateOne(
      { patente: viaje.camion_patente },
      {
        $set: { estado: 'disponible' },
        $max: { kilometraje_actual: kmFin }
      }
    );
    await db.collection('choferes').updateOne(
      { dni: viaje.chofer_dni },
      { $set: { estado: 'disponible' } }
    );

    res.json({ success: true, viaje_id: id, km_recorridos: kmRecorridos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
