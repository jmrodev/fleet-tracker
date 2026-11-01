const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:secretpassword@localhost:27017/?authSource=admin';
const DB_NAME = 'flota_transporte_db';

let db = null;
let client = null;

async function connectDB() {
  if (db) return db;
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
    return db;
  } catch (err) {
    console.error('[FATAL] Error de conexión con MongoDB:', err.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llame a connectDB primero.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    client = null;
  }
}

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

module.exports = {
  connectDB,
  getDB,
  closeDB
};
