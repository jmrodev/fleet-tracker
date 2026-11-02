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
    console.error('[ERROR] Error de conexión con MongoDB:', err.message);
    throw err;
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

  console.log('[INFO] Sembrando ecosistema completo de Flota, Choferes y Viajes...');

  // 1. Choferes Profesionales
  const choferesSeed = [
    {
      dni: '35111222',
      nombre: 'Horacio Molina',
      telefono: '+54 249 455-1234',
      foto_url: '/images/choferes/horacio.jpg',
      licencia: { categoria: 'E1', vencimiento: '2027-08-15' },
      estado: 'disponible',
      creado_en: new Date('2026-01-10T08:00:00Z')
    },
    {
      dni: '38333444',
      nombre: 'Esteban Benítez',
      telefono: '+54 249 466-5678',
      foto_url: '/images/choferes/esteban.jpg',
      licencia: { categoria: 'E1', vencimiento: '2026-12-10' },
      estado: 'asignado', // En viaje activo
      creado_en: new Date('2026-01-15T09:00:00Z')
    },
    {
      dni: '32999888',
      nombre: 'Carlos Varela',
      telefono: '+54 249 477-8899',
      foto_url: '/images/choferes/carlos.jpg',
      licencia: { categoria: 'E2', vencimiento: '2028-03-20' },
      estado: 'disponible',
      creado_en: new Date('2026-02-01T10:00:00Z')
    },
    {
      dni: '40444555',
      nombre: 'Marcos Quiroga',
      telefono: '+54 249 488-9900',
      foto_url: '/images/choferes/marcos.jpg',
      licencia: { categoria: 'E1', vencimiento: '2027-11-05' },
      estado: 'descanso',
      creado_en: new Date('2026-02-15T11:00:00Z')
    },
    {
      dni: '36777888',
      nombre: 'Laura Giménez',
      telefono: '+54 249 499-1122',
      foto_url: '/images/choferes/laura.jpg',
      licencia: { categoria: 'E2', vencimiento: '2028-05-30' },
      estado: 'disponible',
      creado_en: new Date('2026-03-01T12:00:00Z')
    }
  ];

  await db.collection('choferes').insertMany(choferesSeed);

  // 2. Camiones con Hojas de Vida Embebidas ($mantenimientos)
  const camionesSeed = [
    {
      patente: 'AE123CD',
      marca: 'Scania',
      modelo: 'R450 Highline',
      anio: 2022,
      capacidad_kg: 28000,
      kilometraje_actual: 145000,
      foto_url: '/images/camiones/scania.jpg',
      estado: 'disponible',
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Cambio de aceite sintético y filtros completos',
          taller: 'Scania Oficial Tandil',
          costo: 320000,
          km_servicio: 140000,
          detalles: 'Aceite LDF-4 y sustitución de trampa de agua',
          fecha: new Date('2026-09-15T14:30:00Z')
        },
        {
          id: new ObjectId().toString(),
          tipo: 'Regulación de válvulas e inyectores XPI',
          taller: 'Scania Oficial Tandil',
          costo: 185000,
          km_servicio: 120000,
          detalles: 'Ajuste fino de inyección en banco de prueba',
          fecha: new Date('2026-05-10T10:00:00Z')
        }
      ],
      creado_en: new Date('2026-01-10T08:00:00Z')
    },
    {
      patente: 'AF456GH',
      marca: 'Mercedes-Benz',
      modelo: 'Actros 2651 LS',
      anio: 2023,
      capacidad_kg: 30000,
      kilometraje_actual: 82500,
      foto_url: '/images/camiones/mercedes.jpg',
      estado: 'en_viaje', // En viaje activo
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Calibración de frenos electrónicos EBS y ABS',
          taller: 'Diesel Tandil',
          costo: 240000,
          km_servicio: 80000,
          detalles: 'Reemplazo de pastillas delanteras y test de frenado',
          fecha: new Date('2026-10-02T16:00:00Z')
        }
      ],
      creado_en: new Date('2026-01-15T09:00:00Z')
    },
    {
      patente: 'AD789JK',
      marca: 'Volvo',
      modelo: 'FH 540 Globetrotter',
      anio: 2021,
      capacidad_kg: 32000,
      kilometraje_actual: 210000,
      foto_url: '/images/camiones/volvo.jpg',
      estado: 'disponible',
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Recambio de 4 neumáticos de tracción',
          taller: 'Neumáticos Tandil',
          costo: 980000,
          km_servicio: 205000,
          detalles: 'Neumáticos Michelin 295/80 R22.5 con alineación',
          fecha: new Date('2026-08-20T11:00:00Z')
        },
        {
          id: new ObjectId().toString(),
          tipo: 'Embrague I-Shift y cambio de fluido de transmisión',
          taller: 'Volvo Camiones Bahía Blanca',
          costo: 750000,
          km_servicio: 190000,
          detalles: 'Reemplazo preventivo de disco y actuador',
          fecha: new Date('2026-04-12T09:30:00Z')
        }
      ],
      creado_en: new Date('2026-01-20T10:00:00Z')
    },
    {
      patente: 'AG102LM',
      marca: 'Iveco',
      modelo: 'Hi-Way 440 Cursor 13',
      anio: 2024,
      capacidad_kg: 29000,
      kilometraje_actual: 34000,
      foto_url: '/images/camiones/iveco.jpg',
      estado: 'disponible',
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Service inicial preventivo de 30.000 km',
          taller: 'Iveco Punto Tandil',
          costo: 190000,
          km_servicio: 30000,
          detalles: 'Inspección de 24 puntos y cambio de lubricantes sintéticos',
          fecha: new Date('2026-10-18T15:00:00Z')
        }
      ],
      creado_en: new Date('2026-02-01T08:00:00Z')
    },
    {
      patente: 'AC334PQ',
      marca: 'Ford',
      modelo: 'Cargo 2042',
      anio: 2020,
      capacidad_kg: 26000,
      kilometraje_actual: 285000,
      foto_url: '/images/camiones/ford.jpg',
      estado: 'en_mantenimiento',
      mantenimientos: [
        {
          id: new ObjectId().toString(),
          tipo: 'Reparación integral de suspensión y bujes',
          taller: 'Taller El Eje Tandil',
          costo: 430000,
          km_servicio: 280000,
          detalles: 'Amortiguadores delanteros y silentblocks de cabina',
          fecha: new Date('2026-09-05T12:00:00Z')
        }
      ],
      creado_en: new Date('2026-02-10T10:00:00Z')
    }
  ];

  await db.collection('camiones').insertMany(camionesSeed);

  // 3. Viajes Realistas (Finalizados con Odometría + En Curso)
  const viajesSeed = [
    {
      camion_patente: 'AE123CD',
      chofer_dni: '35111222',
      chofer_nombre: 'Horacio Molina',
      origen: 'Tandil, Buenos Aires',
      destino: 'Puerto de Rosario, Santa Fe',
      carga_descripcion: 'Granos de Cebada Cervecera',
      peso_kg: 27500,
      km_salida: 144350,
      km_llegada: 145000,
      km_recorridos: 650,
      estado: 'finalizado',
      fecha_salida: new Date('2026-10-25T06:00:00Z'),
      fecha_llegada: new Date('2026-10-25T18:30:00Z'),
      observaciones: 'Descarga ágil en terminal portuaria sin demoras.'
    },
    {
      camion_patente: 'AD789JK',
      chofer_dni: '32999888',
      chofer_nombre: 'Carlos Varela',
      origen: 'Olavarría, Buenos Aires',
      destino: 'Zárate, Buenos Aires',
      carga_descripcion: 'Pallets de Cemento Loma Negra',
      peso_kg: 31000,
      km_salida: 209580,
      km_llegada: 210000,
      km_recorridos: 420,
      estado: 'finalizado',
      fecha_salida: new Date('2026-10-28T05:30:00Z'),
      fecha_llegada: new Date('2026-10-28T14:15:00Z'),
      observaciones: 'Tránsito fluido por Ruta 3 y Camino del Buen Ayre.'
    },
    {
      camion_patente: 'AG102LM',
      chofer_dni: '36777888',
      chofer_nombre: 'Laura Giménez',
      origen: 'Tandil, Buenos Aires',
      destino: 'Parque Industrial Pilar, Buenos Aires',
      carga_descripcion: 'Piezas Metalmecánicas Fundidas',
      peso_kg: 24000,
      km_salida: 33620,
      km_llegada: 34000,
      km_recorridos: 380,
      estado: 'finalizado',
      fecha_salida: new Date('2026-10-30T07:00:00Z'),
      fecha_llegada: new Date('2026-10-30T15:00:00Z'),
      observaciones: 'Entrega con remito conforme en nave logística.'
    },
    {
      camion_patente: 'AF456GH',
      chofer_dni: '38333444',
      chofer_nombre: 'Esteban Benítez',
      origen: 'Mar del Plata, Buenos Aires',
      destino: 'Córdoba Capital, Córdoba',
      carga_descripcion: 'Pescado Fresco Termocontrolado (-18°C)',
      peso_kg: 28500,
      km_salida: 82000,
      km_llegada: null,
      km_recorridos: 0,
      estado: 'en_curso',
      fecha_salida: new Date(Date.now() - 4 * 3600 * 1000), // Salió hace 4 horas
      fecha_llegada: null,
      observaciones: 'Monitoreo de frío satelital activo y en rango constante.'
    }
  ];

  await db.collection('viajes').insertMany(viajesSeed);

  console.log('[INFO] Ecosistema de demostración sembrado con éxito (5 camiones, 5 choferes, 4 viajes).');
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
  sembrarDatosIniciales
};
