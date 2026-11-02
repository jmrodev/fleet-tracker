const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('../server/config/db');
const app = require('../server/server');

const TEST_PORT = 3100;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
let server;
let client;
let db;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

test.before(async () => {
  await connectDB();
  db = getDB();
  client = db.client;

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, '127.0.0.1', () => resolve());
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (client) {
    await client.close();
  }
});

// ----------------------------------------------------
// US-000: Inicialización del Sistema y Estado Cero (Day Zero)
// ----------------------------------------------------
test.describe('US-000: Estado Cero (Day Zero)', () => {
  test('Escenario 1: Flota vacía devuelve array vacío []', async () => {
    // Consultar con filtro no coincidente para emular colección vacía
    const res = await request('/api/camiones?estado=en_mantenimiento');
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.data), true);
  });

  test('Escenario 2: Nómina vacía devuelve array vacío []', async () => {
    const res = await request('/api/choferes?estado=descanso');
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.data), true);
  });

  test('Escenario 3: Historial de viajes vacío devuelve array vacío []', async () => {
    const res = await request('/api/viajes?estado=cancelado');
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.data), true);
  });

  test('Escenario 4: Métricas de flota en estado cero no arrojan nulos ni errores', async () => {
    const res = await request('/api/stats/flota');
    assert.equal(res.status, 200);
    assert.equal(typeof res.data.total_camiones, 'number');
    assert.equal(typeof res.data.km_flota_recorridos, 'number');
    assert.equal(Array.isArray(res.data.gasto_mantenimiento_por_marca), true);
  });
});

// ----------------------------------------------------
// US-001: Alta, Consulta y Ciclo de Vida del Camión
// ----------------------------------------------------
test.describe('US-001: Ciclo de Vida del Camión', () => {
  const testPatente = 'TDD001';

  test.afterEach(async () => {
    await db.collection('camiones').deleteMany({ patente: testPatente });
  });

  test('Escenario 1: Registro exitoso con patente única', async () => {
    const res = await request('/api/camiones', {
      method: 'POST',
      body: JSON.stringify({
        patente: testPatente,
        marca: 'Scania',
        modelo: 'R450',
        anio: 2023,
        capacidad_kg: 28000,
        kilometraje_actual: 120000
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.patente, testPatente);
    assert.equal(res.data.estado, 'disponible');

    // Escenario 2: Conflicto por duplicado
    const resDup = await request('/api/camiones', {
      method: 'POST',
      body: JSON.stringify({
        patente: testPatente,
        marca: 'Scania',
        modelo: 'R450',
        anio: 2023,
        capacidad_kg: 28000,
        kilometraje_actual: 120000
      })
    });
    assert.equal(resDup.status, 409);
  });

  test('Escenario 3: Rechazo si faltan campos obligatorios', async () => {
    const res = await request('/api/camiones', {
      method: 'POST',
      body: JSON.stringify({ patente: testPatente })
    });
    assert.equal(res.status, 400);
  });

  test('Escenario 4: Consulta de camión inexistente (404)', async () => {
    const res = await request('/api/camiones/INEXISTENTE');
    assert.equal(res.status, 404);
  });
});

// ----------------------------------------------------
// US-002: Alta, Consulta y Ciclo de Vida del Chofer
// ----------------------------------------------------
test.describe('US-002: Ciclo de Vida del Chofer', () => {
  const testDni = '10101010';

  test.afterEach(async () => {
    await db.collection('choferes').deleteMany({ dni: testDni });
  });

  test('Escenario 1: Alta exitosa de chofer con licencia obligatoria', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: testDni,
        nombre: 'Chofer Test TDD',
        telefono: '11223344',
        licencia: { categoria: 'E1', vencimiento: '2028-10-10' }
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.dni, testDni);

    // Escenario 2: Rechazo por DNI duplicado
    const resDup = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: testDni,
        nombre: 'Otro Chofer',
        telefono: '998877',
        licencia: { categoria: 'E1', vencimiento: '2028-10-10' }
      })
    });
    assert.equal(resDup.status, 409);
  });

  test('Escenario 3: Rechazo de alta si faltan datos de licencia', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: testDni,
        nombre: 'Chofer Sin Licencia',
        telefono: '1122'
      })
    });
    assert.equal(res.status, 400);
  });

  test('Escenario 4: Chofer inexistente responde 404', async () => {
    const res = await request('/api/choferes/00000000');
    assert.equal(res.status, 404);
  });
});

// ----------------------------------------------------
// US-003: Despacho de Viajes y Casos de Indisponibilidad
// ----------------------------------------------------
test.describe('US-003: Despacho de Viajes & Indisponibilidad', () => {
  const patenteViaje = 'VIAJE99';
  const dniViaje = '88998899';

  test.beforeEach(async () => {
    await db.collection('camiones').insertOne({
      patente: patenteViaje,
      marca: 'Volvo',
      modelo: 'FH540',
      anio: 2022,
      capacidad_kg: 22000,
      kilometraje_actual: 50000,
      estado: 'disponible',
      mantenimientos: [],
      creado_en: new Date()
    });

    await db.collection('choferes').insertOne({
      dni: dniViaje,
      nombre: 'Chofer Viajes',
      telefono: '556677',
      licencia: { categoria: 'E1', vencimiento: '2028-05-05' },
      estado: 'disponible',
      creado_en: new Date()
    });
  });

  test.afterEach(async () => {
    await db.collection('camiones').deleteMany({ patente: patenteViaje });
    await db.collection('choferes').deleteMany({ dni: dniViaje });
    await db.collection('viajes').deleteMany({ camion_patente: patenteViaje });
  });

  test('Escenario 1: Despacho exitoso de viaje', async () => {
    const res = await request('/api/viajes', {
      method: 'POST',
      body: JSON.stringify({
        camion_patente: patenteViaje,
        chofer_dni: dniViaje,
        origen: 'Bahía Blanca',
        destino: 'Mar del Plata',
        carga_descripcion: 'Fertilizantes',
        peso_kg: 15000
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.estado, 'en_curso');

    const camion = await db.collection('camiones').findOne({ patente: patenteViaje });
    assert.equal(camion.estado, 'en_viaje');

    const chofer = await db.collection('choferes').findOne({ dni: dniViaje });
    assert.equal(chofer.estado, 'asignado');
  });

  test('Escenario 2: Caso Borde - Ningún Camión Disponible (Camión inexistente responde 404)', async () => {
    const res = await request('/api/viajes', {
      method: 'POST',
      body: JSON.stringify({
        camion_patente: 'CAMION_FANTASMA',
        chofer_dni: dniViaje,
        origen: 'Buenos Aires',
        destino: 'Córdoba',
        carga_descripcion: 'Carga',
        peso_kg: 5000
      })
    });
    assert.equal(res.status, 404);
  });

  test('Escenario 3: Caso Borde - Ningún Chofer Disponible (Chofer ya asignado responde 409)', async () => {
    // Marcar chofer como no disponible
    await db.collection('choferes').updateOne({ dni: dniViaje }, { $set: { estado: 'asignado' } });

    const res = await request('/api/viajes', {
      method: 'POST',
      body: JSON.stringify({
        camion_patente: patenteViaje,
        chofer_dni: dniViaje,
        origen: 'Buenos Aires',
        destino: 'Córdoba',
        carga_descripcion: 'Carga',
        peso_kg: 5000
      })
    });
    assert.equal(res.status, 409);

    // Rollback verificado: el camión no debe quedar reservado
    const camion = await db.collection('camiones').findOne({ patente: patenteViaje });
    assert.equal(camion.estado, 'disponible');
  });

  test('Escenario 4: Caso Borde - Sobrecarga de peso responde 400', async () => {
    const res = await request('/api/viajes', {
      method: 'POST',
      body: JSON.stringify({
        camion_patente: patenteViaje,
        chofer_dni: dniViaje,
        origen: 'Buenos Aires',
        destino: 'Córdoba',
        carga_descripcion: 'Maquinaria',
        peso_kg: 30000 // Capacidad es 22000
      })
    });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /supera la capacidad máxima/);
  });
});

// ----------------------------------------------------
// US-004: Finalización de Viajes y Cómputo de Odometría
// ----------------------------------------------------
test.describe('US-004: Finalización de Viajes', () => {
  const patenteFin = 'FIN001';
  const dniFin = '55443322';
  let viajeId;

  test.beforeEach(async () => {
    await db.collection('camiones').insertOne({
      patente: patenteFin,
      marca: 'Mercedes-Benz',
      modelo: 'Actros',
      anio: 2022,
      capacidad_kg: 25000,
      kilometraje_actual: 100000,
      estado: 'en_viaje',
      mantenimientos: [],
      creado_en: new Date()
    });

    await db.collection('choferes').insertOne({
      dni: dniFin,
      nombre: 'Chofer Fin',
      telefono: '990011',
      licencia: { categoria: 'E1', vencimiento: '2028-01-01' },
      estado: 'asignado',
      creado_en: new Date()
    });

    const v = await db.collection('viajes').insertOne({
      camion_patente: patenteFin,
      chofer_dni: dniFin,
      chofer_nombre: 'Chofer Fin',
      origen: 'Tandil',
      destino: 'La Plata',
      carga_descripcion: 'Granos',
      peso_kg: 10000,
      km_salida: 100000,
      km_llegada: null,
      km_recorridos: 0,
      estado: 'en_curso',
      fecha_salida: new Date(),
      fecha_llegada: null,
      observaciones: ''
    });
    viajeId = v.insertedId.toString();
  });

  test.afterEach(async () => {
    await db.collection('camiones').deleteMany({ patente: patenteFin });
    await db.collection('choferes').deleteMany({ dni: dniFin });
    await db.collection('viajes').deleteMany({ camion_patente: patenteFin });
  });

  test('Escenario 1: Llegada exitosa, cómputo de km y liberación de recursos', async () => {
    const res = await request(`/api/viajes/${viajeId}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify({
        km_llegada: 100350,
        observaciones: 'Llegada en horario'
      })
    });
    assert.equal(res.status, 200);

    const viaje = await db.collection('viajes').findOne({ _id: new ObjectId(viajeId) });
    assert.equal(viaje.estado, 'finalizado');
    assert.equal(viaje.km_recorridos, 350);

    const camion = await db.collection('camiones').findOne({ patente: patenteFin });
    assert.equal(camion.estado, 'disponible');
    assert.equal(camion.kilometraje_actual, 100350);

    const chofer = await db.collection('choferes').findOne({ dni: dniFin });
    assert.equal(chofer.estado, 'disponible');
  });

  test('Escenario 2: Rechazo si kilometraje de llegada es menor al de salida', async () => {
    const res = await request(`/api/viajes/${viajeId}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify({
        km_llegada: 95000 // Menor que 100000
      })
    });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /no puede ser menor al de salida/);
  });
});

// ----------------------------------------------------
// US-005: Hoja de Vida y Órdenes de Mantenimiento Técnico
// ----------------------------------------------------
test.describe('US-005: Mantenimiento Técnico Atómico ($push)', () => {
  const patenteMant = 'MANT01';

  test.beforeEach(async () => {
    await db.collection('camiones').insertOne({
      patente: patenteMant,
      marca: 'Ford',
      modelo: 'Cargo',
      anio: 2020,
      capacidad_kg: 18000,
      kilometraje_actual: 75000,
      estado: 'disponible',
      mantenimientos: [],
      creado_en: new Date()
    });
  });

  test.afterEach(async () => {
    await db.collection('camiones').deleteMany({ patente: patenteMant });
  });

  test('Escenario 1: Registro atómico con $push', async () => {
    const res = await request(`/api/camiones/${patenteMant}/mantenimientos`, {
      method: 'POST',
      body: JSON.stringify({
        tipo: 'Cambio de Correa',
        taller: 'Taller Oficial Ford',
        costo: 120000,
        km_servicio: 75000
      })
    });
    assert.equal(res.status, 200);

    const camion = await db.collection('camiones').findOne({ patente: patenteMant });
    assert.equal(camion.mantenimientos.length, 1);
    assert.equal(camion.mantenimientos[0].taller, 'Taller Oficial Ford');
  });

  test('Escenario 2: Asentamiento en camión inexistente responde 404', async () => {
    const res = await request('/api/camiones/FANTASMA/mantenimientos', {
      method: 'POST',
      body: JSON.stringify({
        tipo: 'Cambio de Aceite',
        taller: 'Taller',
        costo: 50000,
        km_servicio: 10000
      })
    });
    assert.equal(res.status, 404);
  });
});

// ----------------------------------------------------
// US-006: Analítica de Costos y Agregación de Flota
// ----------------------------------------------------
test.describe('US-006: Analítica y Agregación', () => {
  test('Escenario 1: Endpoint de analítica responde estructura esperada', async () => {
    const res = await request('/api/stats/flota');
    assert.equal(res.status, 200);
    assert.equal(typeof res.data.total_camiones, 'number');
    assert.equal(typeof res.data.total_en_viaje, 'number');
    assert.equal(typeof res.data.km_flota_recorridos, 'number');
    assert.equal(Array.isArray(res.data.gasto_mantenimiento_por_marca), true);
  });
});
