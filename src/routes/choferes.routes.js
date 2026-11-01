const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

// Listar choferes
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.estado) {
      filter.estado = req.query.estado;
    }
    const choferes = await db.collection('choferes').find(filter).sort({ nombre: 1 }).toArray();
    res.json(choferes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar nuevo chofer
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { dni, nombre, telefono, licencia } = req.body;
    if (!dni || !nombre || !telefono || !licencia) {
      return res.status(400).json({ error: 'DNI, nombre, teléfono y licencia son obligatorios' });
    }

    const doc = {
      dni: String(dni).trim(),
      nombre: String(nombre).trim(),
      telefono: String(telefono).trim(),
      licencia: {
        categoria: String(licencia.categoria || 'E1').trim(),
        vencimiento: String(licencia.vencimiento || '')
      },
      estado: 'disponible',
      creado_en: new Date()
    };

    const result = await db.collection('choferes').insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `El chofer con DNI '${req.body.dni}' ya existe.` });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
