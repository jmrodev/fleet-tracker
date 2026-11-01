const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// 1. Listar camiones (con filtro opcional de estado)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.estado) {
      filter.estado = req.query.estado;
    }
    const camiones = await db.collection('camiones').find(filter).sort({ patente: 1 }).toArray();
    res.json(camiones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Obtener un camión por patente
router.get('/:patente', async (req, res) => {
  try {
    const db = getDB();
    const patente = req.params.patente.toUpperCase();
    const camion = await db.collection('camiones').findOne({ patente });
    if (!camion) {
      return res.status(404).json({ error: `Camión con patente '${patente}' no encontrado.` });
    }
    res.json(camion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Registrar nuevo camión (Create)
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { patente, marca, modelo, anio, capacidad_kg, kilometraje_actual, foto_url } = req.body;
    if (!patente || !marca || !modelo || !anio || !capacidad_kg) {
      return res.status(400).json({ error: 'patente, marca, modelo, año y capacidad_kg son obligatorios' });
    }

    const doc = {
      patente: String(patente).trim().toUpperCase(),
      marca: String(marca).trim(),
      modelo: String(modelo).trim(),
      anio: Number(anio),
      capacidad_kg: Number(capacidad_kg),
      kilometraje_actual: Number(kilometraje_actual || 0),
      foto_url: String(foto_url || '').trim(),
      estado: 'disponible',
      mantenimientos: [],
      creado_en: new Date()
    };

    const result = await db.collection('camiones').insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `La patente '${req.body.patente}' ya está registrada (índice único).` });
    }
    res.status(500).json({ error: err.message });
  }
});

// Estados operacionales válidos (Strict State Machine Invariant)
const ESTADOS_CAMION_VALIDOS = ['disponible', 'en_mantenimiento', 'en_viaje'];

// 4. Actualizar camión (Update)
router.put('/:patente', async (req, res) => {
  try {
    const db = getDB();
    const patente = req.params.patente.toUpperCase();
    const { marca, modelo, anio, capacidad_kg, kilometraje_actual, estado, foto_url } = req.body;

    const fieldsToSet = {};
    if (marca !== undefined) fieldsToSet.marca = String(marca).trim();
    if (modelo !== undefined) fieldsToSet.modelo = String(modelo).trim();
    if (anio !== undefined) fieldsToSet.anio = Number(anio);
    if (capacidad_kg !== undefined) fieldsToSet.capacidad_kg = Number(capacidad_kg);
    if (kilometraje_actual !== undefined) {
      const kmNum = Number(kilometraje_actual);
      if (isNaN(kmNum) || kmNum < 0) {
        return res.status(400).json({ error: 'kilometraje_actual debe ser un número mayor o igual a 0' });
      }
      fieldsToSet.kilometraje_actual = kmNum;
    }
    if (estado !== undefined) {
      const estadoStr = String(estado).trim();
      if (!ESTADOS_CAMION_VALIDOS.includes(estadoStr)) {
        return res.status(400).json({ 
          error: `Estado inválido '${estadoStr}'. Estados permitidos: ${ESTADOS_CAMION_VALIDOS.join(', ')}` 
        });
      }
      fieldsToSet.estado = estadoStr;
    }
    if (foto_url !== undefined) fieldsToSet.foto_url = String(foto_url).trim();

    if (Object.keys(fieldsToSet).length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
    }

    const result = await db.collection('camiones').findOneAndUpdate(
      { patente },
      { $set: fieldsToSet },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: `Camión con patente '${patente}' no encontrado.` });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Eliminar camión (Delete)
router.delete('/:patente', async (req, res) => {
  try {
    const db = getDB();
    const patente = req.params.patente.toUpperCase();

    const camion = await db.collection('camiones').findOne({ patente });
    if (!camion) {
      return res.status(404).json({ error: `Camión con patente '${patente}' no encontrado.` });
    }

    if (camion.estado === 'en_viaje') {
      return res.status(400).json({ error: `No se puede eliminar la unidad ${patente} porque está en viaje activo.` });
    }

    await db.collection('camiones').deleteOne({ patente });
    res.json({ success: true, message: `Camión ${patente} eliminado correctamente.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Registrar orden de mantenimiento ($push atómico en array embebido)
router.post('/:patente/mantenimientos', async (req, res) => {
  try {
    const db = getDB();
    const patente = req.params.patente.toUpperCase();
    const { tipo, taller, costo, km_servicio, detalles, cambiar_estado } = req.body;

    if (!tipo || costo === undefined || !km_servicio) {
      return res.status(400).json({ error: 'tipo, costo y km_servicio son obligatorios' });
    }

    const registro = {
      id: new ObjectId().toString(),
      tipo: String(tipo).trim(),
      taller: String(taller || 'Taller Interno').trim(),
      costo: Number(costo),
      km_servicio: Number(km_servicio),
      detalles: String(detalles || ''),
      fecha: new Date()
    };

    const updateOps = {
      $push: { mantenimientos: registro }
    };

    // Si explícitamente se solicita cambio de estado (ej: 'disponible' o 'en_mantenimiento')
    if (cambiar_estado !== undefined) {
      const estadoStr = String(cambiar_estado).trim();
      if (!ESTADOS_CAMION_VALIDOS.includes(estadoStr)) {
        return res.status(400).json({ 
          error: `Estado inválido '${estadoStr}'. Permitidos: ${ESTADOS_CAMION_VALIDOS.join(', ')}` 
        });
      }
      updateOps.$set = { estado: estadoStr };
    }

    const result = await db.collection('camiones').updateOne(
      { patente },
      updateOps
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: `Camión con patente ${patente} no encontrado` });
    }

    res.json({ success: true, mantenimiento: registro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
