const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// Listar viajes
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.estado) {
      filter.estado = req.query.estado;
    }
    const viajes = await db.collection('viajes').find(filter).sort({ fecha_salida: -1 }).toArray();
    res.json(viajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Despachar nuevo viaje
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { camion_patente, chofer_dni, origen, destino, carga_descripcion, peso_kg, km_salida } = req.body;
    if (!camion_patente || !chofer_dni || !origen || !destino || !carga_descripcion || !peso_kg) {
      return res.status(400).json({ error: 'Faltan parámetros del viaje' });
    }

    const camion = await db.collection('camiones').findOne({ patente: camion_patente.toUpperCase() });
    if (!camion) return res.status(404).json({ error: 'Camión no encontrado' });
    if (camion.estado !== 'disponible') {
      return res.status(400).json({ error: `El camión ${camion_patente} no está disponible (Estado actual: ${camion.estado})` });
    }
    if (Number(peso_kg) > camion.capacidad_kg) {
      return res.status(400).json({ error: `Sobrecarga: El peso (${peso_kg} kg) supera la capacidad máxima (${camion.capacidad_kg} kg)` });
    }

    const chofer = await db.collection('choferes').findOne({ dni: String(chofer_dni) });
    if (!chofer) return res.status(404).json({ error: 'Chofer no encontrado' });
    if (chofer.estado !== 'disponible') {
      return res.status(400).json({ error: `El chofer ${chofer.nombre} no está disponible (Estado actual: ${chofer.estado})` });
    }

    const salidaKm = Number(km_salida || camion.kilometraje_actual || 0);

    const docViaje = {
      camion_patente: camion.patente,
      chofer_dni: chofer.dni,
      chofer_nombre: chofer.nombre,
      origen: String(origen).trim(),
      destino: String(destino).trim(),
      carga_descripcion: String(carga_descripcion).trim(),
      peso_kg: Number(peso_kg),
      km_salida: salidaKm,
      km_llegada: null,
      km_recorridos: 0,
      estado: 'en_curso',
      fecha_salida: new Date(),
      fecha_llegada: null,
      observaciones: ''
    };

    const result = await db.collection('viajes').insertOne(docViaje);

    // Actualización atómica en camión y chofer
    await db.collection('camiones').updateOne({ patente: camion.patente }, { $set: { estado: 'en_viaje' } });
    await db.collection('choferes').updateOne({ dni: chofer.dni }, { $set: { estado: 'asignado' } });

    res.status(201).json({ _id: result.insertedId, ...docViaje });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finalizar viaje y asentar odometría
router.put('/:id/finalizar', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { km_llegada, observaciones } = req.body;

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
          observaciones: String(observaciones || '')
        }
      }
    );

    // Liberar recursos y actualizar odómetro del camión
    await db.collection('camiones').updateOne(
      { patente: viaje.camion_patente },
      {
        $set: {
          estado: 'disponible',
          kilometraje_actual: kmFin
        }
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
