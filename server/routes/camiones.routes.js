const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// Estados operacionales válidos (Strict State Machine Invariant)
const ESTADOS_CAMION_VALIDOS = ['disponible', 'en_mantenimiento', 'en_viaje'];

// 1. Listar camiones (con filtro sanitizado de estado y paginación defensiva)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.estado !== undefined) {
      const estadoSanitizado = String(req.query.estado).trim();
      if (!ESTADOS_CAMION_VALIDOS.includes(estadoSanitizado)) {
        return res.status(400).json({ 
          error: `Filtro de estado inválido '${estadoSanitizado}'. Permitidos: ${ESTADOS_CAMION_VALIDOS.join(', ')}` 
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

    const camiones = await db.collection('camiones')
      .find(filter)
      .sort({ patente: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
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
    if (!patente || !marca || !modelo || !anio || !capacidad_kg || kilometraje_actual === undefined) {
      return res.status(400).json({ error: 'patente, marca, modelo, anio, capacidad_kg y kilometraje_actual son obligatorios' });
    }

    const patenteLimpia = String(patente).trim().toUpperCase();
    if (patenteLimpia.length === 0) {
      return res.status(400).json({ error: 'La patente no puede estar vacía' });
    }

    // Regla de formato: solo letras y números (alfanumérico sin espacios ni símbolos)
    const patenteRegex = /^[A-Z0-9]+$/;
    if (!patenteRegex.test(patenteLimpia)) {
      return res.status(400).json({ error: 'Formato de patente inválido. Solo debe contener caracteres alfanuméricos.' });
    }

    const anioParsed = Number(anio);
    const anioActual = new Date().getFullYear();
    if (isNaN(anioParsed) || anioParsed < 1950 || anioParsed > anioActual + 1) {
      return res.status(400).json({ error: `El anio del camión debe ser un número válido entre 1950 y ${anioActual + 1}` });
    }

    const capacidadParsed = Number(capacidad_kg);
    if (isNaN(capacidadParsed) || capacidadParsed <= 0) {
      return res.status(400).json({ error: 'capacidad_kg debe ser un número estrictamente mayor a 0' });
    }

    const kmParsed = Number(kilometraje_actual);
    if (isNaN(kmParsed) || kmParsed < 0) {
      return res.status(400).json({ error: 'kilometraje_actual debe ser un número mayor o igual a 0' });
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

    const result = await db.collection('camiones').insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `La patente '${req.body.patente}' ya está registrada (índice único).` });
    }
    res.status(500).json({ error: err.message });
  }
});

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

    if (!tipo || !taller || costo === undefined || km_servicio === undefined) {
      return res.status(400).json({ error: 'tipo, taller, costo y km_servicio son obligatorios' });
    }

    const costoParsed = Number(costo);
    if (isNaN(costoParsed) || costoParsed < 0) {
      return res.status(400).json({ error: 'costo debe ser un número mayor o igual a 0' });
    }

    const kmServParsed = Number(km_servicio);
    if (isNaN(kmServParsed) || kmServParsed < 0) {
      return res.status(400).json({ error: 'km_servicio debe ser un número mayor o igual a 0' });
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
