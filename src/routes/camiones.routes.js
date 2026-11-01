const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// Listar camiones
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

// Registrar nuevo camión
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { patente, marca, modelo, anio, capacidad_kg, kilometraje_actual } = req.body;
    if (!patente || !marca || !modelo || !anio || !capacidad_kg) {
      return res.status(400).json({ error: 'Faltan campos requeridos del camión' });
    }

    const doc = {
      patente: String(patente).trim().toUpperCase(),
      marca: String(marca).trim(),
      modelo: String(modelo).trim(),
      anio: Number(anio),
      capacidad_kg: Number(capacidad_kg),
      kilometraje_actual: Number(kilometraje_actual || 0),
      estado: 'disponible',
      mantenimientos: [],
      creado_en: new Date()
    };

    const result = await db.collection('camiones').insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `La patente '${req.body.patente}' ya está registrada.` });
    }
    res.status(500).json({ error: err.message });
  }
});

// Registrar orden de servicio técnico en el camión ($push atómico)
router.post('/:patente/mantenimientos', async (req, res) => {
  try {
    const db = getDB();
    const patente = req.params.patente.toUpperCase();
    const { tipo, taller, costo, km_servicio, detalles } = req.body;

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

    const result = await db.collection('camiones').updateOne(
      { patente },
      {
        $push: { mantenimientos: registro },
        $set: { estado: 'disponible' }
      }
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
