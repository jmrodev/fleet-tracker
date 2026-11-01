const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

// 1. Listar choferes (con filtro opcional de estado)
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

// 2. Obtener detalle de chofer por DNI
router.get('/:dni', async (req, res) => {
  try {
    const db = getDB();
    const dni = String(req.params.dni).trim();
    const chofer = await db.collection('choferes').findOne({ dni });
    if (!chofer) {
      return res.status(404).json({ error: `Chofer con DNI '${dni}' no encontrado.` });
    }
    res.json(chofer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Registrar nuevo chofer (Create)
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { dni, nombre, telefono, licencia, foto_url } = req.body;
    if (!dni || !nombre || !telefono || !licencia) {
      return res.status(400).json({ error: 'DNI, nombre, teléfono y licencia son obligatorios' });
    }

    const doc = {
      dni: String(dni).trim(),
      nombre: String(nombre).trim(),
      telefono: String(telefono).trim(),
      licencia: {
        categoria: String(licencia.categoria || 'E1').trim(),
        vencimiento: String(licencia.vencimiento || '').trim()
      },
      foto_url: String(foto_url || '').trim(),
      estado: 'disponible',
      creado_en: new Date()
    };

    const result = await db.collection('choferes').insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `El chofer con DNI '${req.body.dni}' ya existe (índice único).` });
    }
    res.status(500).json({ error: err.message });
  }
});

// 4. Actualizar chofer (Update)
router.put('/:dni', async (req, res) => {
  try {
    const db = getDB();
    const dni = String(req.params.dni).trim();
    const { nombre, telefono, licencia, estado, foto_url } = req.body;

    const fieldsToSet = {};
    if (nombre !== undefined) fieldsToSet.nombre = String(nombre).trim();
    if (telefono !== undefined) fieldsToSet.telefono = String(telefono).trim();
    if (estado !== undefined) fieldsToSet.estado = String(estado).trim();
    if (foto_url !== undefined) fieldsToSet.foto_url = String(foto_url).trim();

    if (licencia) {
      if (licencia.categoria) fieldsToSet['licencia.categoria'] = String(licencia.categoria).trim();
      if (licencia.vencimiento) fieldsToSet['licencia.vencimiento'] = String(licencia.vencimiento).trim();
    }

    if (Object.keys(fieldsToSet).length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
    }

    const result = await db.collection('choferes').findOneAndUpdate(
      { dni },
      { $set: fieldsToSet },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: `Chofer con DNI '${dni}' no encontrado.` });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Eliminar chofer (Delete)
router.delete('/:dni', async (req, res) => {
  try {
    const db = getDB();
    const dni = String(req.params.dni).trim();

    const chofer = await db.collection('choferes').findOne({ dni });
    if (!chofer) {
      return res.status(404).json({ error: `Chofer con DNI '${dni}' no encontrado.` });
    }

    if (chofer.estado === 'asignado') {
      return res.status(400).json({ error: `No se puede eliminar al chofer ${chofer.nombre} porque tiene un viaje asignado en curso.` });
    }

    await db.collection('choferes').deleteOne({ dni });
    res.json({ success: true, message: `Chofer ${dni} eliminado correctamente.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
