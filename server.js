const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:secretpassword@localhost:27017/?authSource=admin';
const DB_NAME = 'flota_transporte_db';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = null;
let client = null;

// ==========================================
// 1. HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ==========================================
// 2. CAMIONES
// ==========================================
app.get('/api/camiones', async (req, res) => {
  try {
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

app.post('/api/camiones', async (req, res) => {
  try {
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
      estado: 'disponible', // disponible | en_viaje | en_mantenimiento
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

// ==========================================
// 3. CHOFERES
// ==========================================
app.get('/api/choferes', async (req, res) => {
  try {
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

app.post('/api/choferes', async (req, res) => {
  try {
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
      estado: 'disponible', // disponible | asignado | descanso
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

// ==========================================
// 4. VIAJES (SEGUIMIENTO)
// ==========================================
app.get('/api/viajes', async (req, res) => {
  try {
    const filter = {};
    if (req.query.estado) {
      filter.estado = req.query.estado;
    }
    const viajes = await db.collection('viajes').find(filter).sort({ salida_estimada: -1 }).toArray();
    res.json(viajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/viajes', async (req, res) => {
  try {
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

app.put('/api/viajes/:id/finalizar', async (req, res) => {
  try {
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

// ==========================================
// 5. MANTENIMIENTO ($push ATÓMICO EN CAMIÓN)
// ==========================================
app.post('/api/camiones/:patente/mantenimientos', async (req, res) => {
  try {
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
        $set: { estado: 'disponible' } // Finaliza mantenimiento si estaba en el taller
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

// ==========================================
// 6. AGGREGATION PIPELINE (ANALÍTICA EN EL MOTOR)
// ==========================================
app.get('/api/stats/flota', async (req, res) => {
  try {
    const totalCamiones = await db.collection('camiones').countDocuments();
    const totalEnViaje = await db.collection('camiones').countDocuments({ estado: 'en_viaje' });
    const totalMantenimiento = await db.collection('camiones').countDocuments({ estado: 'en_mantenimiento' });

    // Pipeline: Desenrollar mantenimientos embebidos y calcular gastos totales por Marca
    const pipelineGastos = [
      { $unwind: '$mantenimientos' },
      {
        $group: {
          _id: '$marca',
          total_gastado: { $sum: '$mantenimientos.costo' },
          servicios: { $sum: 1 },
          costo_promedio: { $avg: '$mantenimientos.costo' }
        }
      },
      { $sort: { total_gastado: -1 } }
    ];

    const gastosPorMarca = await db.collection('camiones').aggregate(pipelineGastos).toArray();

    // Pipeline: Total de kilómetros recorridos por todos los viajes finalizados
    const pipelineKm = [
      { $match: { estado: 'finalizado' } },
      {
        $group: {
          _id: null,
          km_totales: { $sum: '$km_recorridos' },
          viajes_totales: { $sum: 1 }
        }
      }
    ];

    const kmData = await db.collection('viajes').aggregate(pipelineKm).toArray();
    const kmTotales = kmData.length > 0 ? kmData[0].km_totales : 0;
    const viajesTotales = kmData.length > 0 ? kmData[0].viajes_totales : 0;

    res.json({
      total_camiones: totalCamiones,
      total_en_viaje: totalEnViaje,
      total_mantenimiento: totalMantenimiento,
      km_flota_recorridos: kmTotales,
      viajes_finalizados: viajesTotales,
      gasto_mantenimiento_por_marca: gastosPorMarca
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Semillero inicial de datos para demostración inmediata
async function sembrarDatosIniciales() {
  const count = await db.collection('camiones').countDocuments();
  if (count > 0) return;

  console.log('[INFO] Sembrando flota inicial para la demostración...');
  
  await db.collection('camiones').insertMany([
    {
      patente: 'AE123CD',
      marca: 'Scania',
      modelo: 'R450',
      anio: 2022,
      capacidad_kg: 28000,
      kilometraje_actual: 145000,
      estado: 'disponible',
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Cambio de aceite sintético y filtros',
          taller: 'Scania Oficial Tandil',
          costo: 320000,
          km_servicio: 140000,
          detalles: 'Mantenimiento preventivo de los 140k km',
          fecha: new Date(Date.now() - 30 * 24 * 3600 * 1000)
        }
      ],
      creado_en: new Date()
    },
    {
      patente: 'AF456GH',
      marca: 'Mercedes-Benz',
      modelo: 'Actros 2651',
      anio: 2023,
      capacidad_kg: 30000,
      kilometraje_actual: 82000,
      estado: 'disponible',
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Calibración de inyectores y frenos',
          taller: 'Diesel Tandil',
          costo: 240000,
          km_servicio: 80000,
          detalles: 'Revisión técnica de frenos ABS',
          fecha: new Date(Date.now() - 15 * 24 * 3600 * 1000)
        }
      ],
      creado_en: new Date()
    },
    {
      patente: 'AD789JK',
      marca: 'Volvo',
      modelo: 'FH 540',
      anio: 2021,
      capacidad_kg: 32000,
      kilometraje_actual: 210000,
      estado: 'disponible',
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Recambio de 4 neumáticos traseros',
          taller: 'Neumáticos Tandil',
          costo: 980000,
          km_servicio: 205000,
          detalles: 'Michelin X Multiway',
          fecha: new Date(Date.now() - 45 * 24 * 3600 * 1000)
        }
      ],
      creado_en: new Date()
    }
  ]);

  await db.collection('choferes').insertMany([
    {
      dni: '35111222',
      nombre: 'Horacio Molina',
      telefono: '+54 249 455-1234',
      licencia: { categoria: 'E1', vencimiento: '2027-08-15' },
      estado: 'disponible',
      creado_en: new Date()
    },
    {
      dni: '38333444',
      nombre: 'Esteban Benítez',
      telefono: '+54 249 466-5678',
      licencia: { categoria: 'E1', vencimiento: '2026-12-10' },
      estado: 'disponible',
      creado_en: new Date()
    }
  ]);

  console.log('[INFO] Flota y choferes listos.');
}

async function start() {
  try {
    client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    db = client.db(DB_NAME);

    // Índices obligatorios a nivel motor
    await db.collection('camiones').createIndex({ patente: 1 }, { unique: true });
    await db.collection('camiones').createIndex({ estado: 1 });
    await db.collection('choferes').createIndex({ dni: 1 }, { unique: true });
    await db.collection('viajes').createIndex({ camion_patente: 1 });
    await db.collection('viajes').createIndex({ estado: 1 });

    await sembrarDatosIniciales();

    app.listen(PORT, () => {
      console.log(`[INFO] Sistema de Flota corriendo en: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[FATAL] Error de conexión con MongoDB:', err.message);
    process.exit(1);
  }
}

start();
