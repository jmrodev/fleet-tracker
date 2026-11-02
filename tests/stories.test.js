const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { MongoClient, ObjectId } = require('mongodb');
const { connectDB, getDB } = require('../src/config/db');
const app = require('../server');

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
// US-001: Camiones & Invariantes de Negocio Base
// ----------------------------------------------------
test.describe('US-001: Camiones & Odometría', () => {
  const testPatente = 'TDD999';

  test.afterEach(async () => {
    await db.collection('camiones').deleteMany({ patente: testPatente });
  });

  test('Escenario 1: Registro exitoso con patente única e índice en MongoDB', async () => {
    const payload = {
      patente: testPatente,
      marca: 'Scania',
      modelo: 'R450',
      anio: 2023,
      capacidad_kg: 28000,
      kilometraje_actual: 120000,
      foto_url: 'https://example.com/truck.jpg'
    };

    const res = await request('/api/camiones', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.patente, testPatente);
    assert.equal(res.data.kilometraje_actual, 120000);

    // Intentar registrar duplicado debe responder 409
    const resDuplicado = await request('/api/camiones', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    assert.equal(resDuplicado.status, 409);
    assert.match(resDuplicado.data.error, /ya está registrada/);
  });

  test('Escenario 2: Rechazo de campos obligatorios faltantes (sin fallbacks mágicos)', async () => {
    const payloadIncompleto = {
      patente: testPatente,
      marca: 'Volvo'
      // Omitidos modelo, anio, capacidad_kg, kilometraje_actual
    };

    const res = await request('/api/camiones', {
      method: 'POST',
      body: JSON.stringify(payloadIncompleto)
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /obligatorios/);
  });

  test('Escenario 3: Filtro sanitizado por estado y validación de paginación', async () => {
    // Filtro con estado inválido
    const resInvalido = await request('/api/camiones?estado=destruido');
    assert.equal(resInvalido.status, 400);
    assert.match(resInvalido.data.error, /Filtro de estado inválido/);

    // Paginación con límite inválido
    const resLimitInvalido = await request('/api/camiones?limit=-5');
    assert.equal(resLimitInvalido.status, 400);
    assert.match(resLimitInvalido.data.error, /limit/);

    // Paginación con skip inválido
    const resSkipInvalido = await request('/api/camiones?skip=invalido');
    assert.equal(resSkipInvalido.status, 400);
    assert.match(resSkipInvalido.data.error, /skip/);
  });
});

// ----------------------------------------------------
// US-002: Choferes & Licencias
// ----------------------------------------------------
test.describe('US-002: Choferes & Licencias', () => {
  const testDni = '99887766';

  test.afterEach(async () => {
    await db.collection('choferes').deleteMany({ dni: testDni });
  });

  test('Escenario 1: Alta exitosa con validación de licencia estricta', async () => {
    const payload = {
      dni: testDni,
      nombre: 'Chofer TDD BDD',
      telefono: '+54 11 4455-6677',
      licencia: {
        categoria: 'E1',
        vencimiento: '2028-12-31'
      },
      foto_url: ''
    };

    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.dni, testDni);
    assert.equal(res.data.licencia.categoria, 'E1');

    // Conflicto por DNI duplicado
    const resDup = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    assert.equal(resDup.status, 409);
  });

  test('Escenario 2: Rechazo si falta licencia.categoria o licencia.vencimiento (sin asumir E1 por defecto)', async () => {
    const payloadSinCat = {
      dni: testDni,
      nombre: 'Chofer Incompleto',
      telefono: '123456',
      licencia: {
        vencimiento: '2027-01-01'
      }
    };

    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify(payloadSinCat)
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /licencia\.categoria y licencia\.vencimiento son obligatorios/);
  });
});

// ----------------------------------------------------
// US-003: Mantenimiento Atómico ($push)
// ----------------------------------------------------
test.describe('US-003: Mantenimiento con $push atómico', () => {
  const testPatente = 'MANT99';

  test.beforeEach(async () => {
    await db.collection('camiones').insertOne({
      patente: testPatente,
      marca: 'Iveco',
      modelo: 'Stralis',
      anio: 2022,
      capacidad_kg: 24000,
      kilometraje_actual: 80000,
      estado: 'disponible',
      mantenimientos: [],
      creado_en: new Date()
    });
  });

  test.afterEach(async () => {
    await db.collection('camiones').deleteMany({ patente: testPatente });
  });

  test('Escenario 1: Registro de intervención técnica atómica sin sustituciones mágicas', async () => {
    const orden = {
      tipo: 'Cambio de Inyectores',
      taller: 'Servicio Oficial Iveco',
      costo: 350000,
      km_servicio: 80000,
      detalles: 'Intervención preventiva programada'
    };

    const res = await request(`/api/camiones/${testPatente}/mantenimientos`, {
      method: 'POST',
      body: JSON.stringify(orden)
    });

    assert.equal(res.status, 200);

    const camion = await db.collection('camiones').findOne({ patente: testPatente });
    assert.equal(camion.mantenimientos.length, 1);
    assert.equal(camion.mantenimientos[0].taller, 'Servicio Oficial Iveco');
    assert.equal(camion.mantenimientos[0].costo, 350000);
  });

  test('Escenario 2: Rechazo si falta taller o costo (no asume Taller Interno)', async () => {
    const ordenIncompleta = {
      tipo: 'Alineación y Balanceo',
      km_servicio: 80000
    };

    const res = await request(`/api/camiones/${testPatente}/mantenimientos`, {
      method: 'POST',
      body: JSON.stringify(ordenIncompleta)
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /tipo, taller, costo y km_servicio son obligatorios/);
  });
});

// ----------------------------------------------------
// US-004: Estadísticas & Aggregation Pipeline
// ----------------------------------------------------
test.describe('US-004: Aggregation Pipeline de Flota', () => {
  test('Escenario 1: Cómputo global de KPIs y agregación sin nulos', async () => {
    const res = await request('/api/stats/flota');
    assert.equal(res.status, 200);
    assert.equal(typeof res.data.total_camiones, 'number');
    assert.equal(typeof res.data.total_en_viaje, 'number');
    assert.equal(typeof res.data.km_flota_recorridos, 'number');
    assert.equal(Array.isArray(res.data.gasto_mantenimiento_por_marca), true);
  });
});

// ----------------------------------------------------
// US-005: Concurrencia CAS & Odometría Monótona
// ----------------------------------------------------
test.describe('US-005: Concurrencia Atómica & Odómetro', () => {
  const patenteCAS = 'CAS001';
  const dniCAS = '11223344';

  test.beforeEach(async () => {
    await db.collection('camiones').insertOne({
      patente: patenteCAS,
      marca: 'Scania',
      modelo: 'G410',
      anio: 2021,
      capacidad_kg: 20000,
      kilometraje_actual: 100000,
      estado: 'disponible',
      mantenimientos: [],
      creado_en: new Date()
    });

    await db.collection('choferes').insertOne({
      dni: dniCAS,
      nombre: 'Chofer Concurrente',
      telefono: '112233',
      licencia: { categoria: 'E1', vencimiento: '2028-01-01' },
      estado: 'disponible',
      creado_en: new Date()
    });
  });

  test.afterEach(async () => {
    await db.collection('camiones').deleteMany({ patente: patenteCAS });
    await db.collection('choferes').deleteMany({ dni: dniCAS });
    await db.collection('viajes').deleteMany({ camion_patente: patenteCAS });
  });

  test('Escenario 1: Rechazo si el peso excede la capacidad máxima del camión', async () => {
    const viajeExcedido = {
      camion_patente: patenteCAS,
      chofer_dni: dniCAS,
      origen: 'Buenos Aires',
      destino: 'Córdoba',
      carga_descripcion: 'Maquinaria pesada',
      peso_kg: 25000 // Capacidad del camión es 20000
    };

    const res = await request('/api/viajes', {
      method: 'POST',
      body: JSON.stringify(viajeExcedido)
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /supera la capacidad máxima/);
  });

  test('Escenario 2: Despacho exitoso y rechazo de reserva concurrente', async () => {
    const viajeValido = {
      camion_patente: patenteCAS,
      chofer_dni: dniCAS,
      origen: 'Rosario',
      destino: 'Mendoza',
      carga_descripcion: 'Granos',
      peso_kg: 18000
    };

    // Primer despacho
    const res1 = await request('/api/viajes', {
      method: 'POST',
      body: JSON.stringify(viajeValido)
    });
    assert.equal(res1.status, 201);
    assert.equal(res1.data.estado, 'en_curso');

    // Segundo despacho inmediato con los mismos recursos (debe fallar 409)
    const res2 = await request('/api/viajes', {
      method: 'POST',
      body: JSON.stringify(viajeValido)
    });
    assert.equal(res2.status, 409);
    assert.match(res2.data.error, /no está disponible.*o fue asignado/);

    // Finalizar viaje: Rechazo si km_llegada < km_salida
    const viajeId = res1.data._id;
    const resFinInvalido = await request(`/api/viajes/${viajeId}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify({
        km_llegada: 90000, // Menor que salida (100000)
        observaciones: 'Llegada con odómetro retrocedido'
      })
    });
    assert.equal(resFinInvalido.status, 400);
    assert.match(resFinInvalido.data.error, /no puede ser menor al de salida/);

    // Finalizar viaje válido con actualización monótona
    const resFinValido = await request(`/api/viajes/${viajeId}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify({
        km_llegada: 101200,
        observaciones: 'Llegada a destino sin novedades'
      })
    });
    assert.equal(resFinValido.status, 200);

    const camionActualizado = await db.collection('camiones').findOne({ patente: patenteCAS });
    assert.equal(camionActualizado.kilometraje_actual, 101200);
    assert.equal(camionActualizado.estado, 'disponible');
  });

  test('Escenario 3: Healthcheck con ping activo al motor', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'healthy');
    assert.equal(res.data.database, 'connected');
    assert.equal(typeof res.data.latency_ms, 'number');
  });
});
