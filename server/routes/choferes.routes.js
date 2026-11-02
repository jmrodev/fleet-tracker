const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

// Estados de nómina válidos (Strict State Machine Invariant)
const ESTADOS_CHOFER_VALIDOS = ['disponible', 'asignado', 'descanso'];

// 1. Listar choferes (con filtro sanitizado de estado y paginación defensiva)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.estado !== undefined) {
      const estadoSanitizado = String(req.query.estado).trim();
      if (!ESTADOS_CHOFER_VALIDOS.includes(estadoSanitizado)) {
        return res.status(400).json({ 
          error: `Filtro de estado inválido '${estadoSanitizado}'. Permitidos: ${ESTADOS_CHOFER_VALIDOS.join(', ')}` 
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

    const choferes = await db.collection('choferes')
      .find(filter)
      .sort({ nombre: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
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

// 3. Registrar nuevo chofer (Create con validaciones TDD granulares)
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { dni, nombre, telefono, licencia, foto_url } = req.body;

    // Paso 2: Presencia obligatoria de DNI
    if (!dni) {
      return res.status(400).json({ error: 'El DNI es obligatorio' });
    }

    const dniStr = String(dni).trim();

    // Paso 3: DNI solo números
    if (!/^\d+$/.test(dniStr)) {
      return res.status(400).json({ error: 'El DNI debe contener únicamente números' });
    }

    // Paso 4: DNI longitud mínima (7 cifras)
    if (dniStr.length < 7) {
      return res.status(400).json({ error: 'El DNI no puede tener menos de 7 dígitos' });
    }

    // Paso 5: DNI longitud máxima (8 cifras)
    if (dniStr.length > 8) {
      return res.status(400).json({ error: 'El DNI no puede tener más de 8 dígitos' });
    }

    // Paso 6: Presencia y longitud de Nombre (mínimo 3 caracteres)
    if (!nombre || String(nombre).trim().length < 3) {
      return res.status(400).json({ error: 'El nombre es obligatorio y debe tener al menos 3 caracteres' });
    }

    // Paso 7: Presencia y longitud de Teléfono (mínimo 6 caracteres)
    if (!telefono || String(telefono).trim().length < 6) {
      return res.status(400).json({ error: 'El teléfono es obligatorio y debe tener al menos 6 caracteres' });
    }

    // Paso 8: Estructura estricta de Licencia
    if (!licencia || !licencia.categoria) {
      return res.status(400).json({ error: 'licencia.categoria es obligatorio' });
    }
    if (!licencia.vencimiento) {
      return res.status(400).json({ error: 'licencia.vencimiento es obligatorio' });
    }

    const doc = {
      dni: dniStr,
      nombre: String(nombre).trim(),
      telefono: String(telefono).trim(),
      licencia: {
        categoria: String(licencia.categoria).trim().toUpperCase(),
        vencimiento: String(licencia.vencimiento).trim()
      },
      foto_url: foto_url !== undefined && foto_url !== null ? String(foto_url).trim() : '',
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
    if (estado !== undefined) {
      const estadoStr = String(estado).trim();
      if (!ESTADOS_CHOFER_VALIDOS.includes(estadoStr)) {
        return res.status(400).json({ 
          error: `Estado inválido '${estadoStr}'. Estados permitidos: ${ESTADOS_CHOFER_VALIDOS.join(', ')}` 
        });
      }
      fieldsToSet.estado = estadoStr;
    }
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
