const test = require('node:test');
const assert = require('node:assert/strict');
const { connectDB, getDB } = require('../server/config/db');
const app = require('../server/server');

const TEST_PORT = 3105;
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

test.describe('US-TDD-001: Ciclo Baby Steps de Creación y Validación de Chofer', () => {
  const dniBase = '35111222';

  test.afterEach(async () => {
    await db.collection('choferes').deleteMany({ dni: { $in: [dniBase, '1234567', '12345678', '35000111'] } });
  });

  // -------------------------------------------------------------------------
  // PASO 1 & 2: DNI Requerido
  // -------------------------------------------------------------------------
  test('Paso 2 [Baby Step]: Falla si no se proporciona el DNI', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Juan Perez',
        telefono: '+54 11 4455-6677',
        licencia: { categoria: 'E1', vencimiento: '2028-12-31' }
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /DNI.*obligatorio/i);
  });

  // -------------------------------------------------------------------------
  // PASO 3: DNI Solo Números
  // -------------------------------------------------------------------------
  test('Paso 3 [Baby Step]: Falla si el DNI contiene letras o caracteres no numéricos', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: '38A45B89', // Contiene letras
        nombre: 'Juan Perez',
        telefono: '+54 11 4455-6677',
        licencia: { categoria: 'E1', vencimiento: '2028-12-31' }
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /números/i);
  });

  // -------------------------------------------------------------------------
  // PASO 4: DNI Longitud Mínima (7 dígitos)
  // -------------------------------------------------------------------------
  test('Paso 4 [Baby Step]: Falla si el DNI tiene menos de 7 cifras (demasiado corto)', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: '123456', // 6 dígitos
        nombre: 'Juan Perez',
        telefono: '+54 11 4455-6677',
        licencia: { categoria: 'E1', vencimiento: '2028-12-31' }
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /menos de 7/i);
  });

  // -------------------------------------------------------------------------
  // PASO 5: DNI Longitud Máxima (8 dígitos)
  // -------------------------------------------------------------------------
  test('Paso 5 [Baby Step]: Falla si el DNI tiene más de 8 cifras (demasiado largo)', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: '123456789', // 9 dígitos
        nombre: 'Juan Perez',
        telefono: '+54 11 4455-6677',
        licencia: { categoria: 'E1', vencimiento: '2028-12-31' }
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /más de 8/i);
  });

  // -------------------------------------------------------------------------
  // PASO 6: Nombre Requerido y Longitud Mínima (3 letras)
  // -------------------------------------------------------------------------
  test('Paso 6 [Baby Step]: Falla si el nombre está ausente o tiene menos de 3 caracteres', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: dniBase,
        nombre: 'Al', // Menos de 3 letras
        telefono: '+54 11 4455-6677',
        licencia: { categoria: 'E1', vencimiento: '2028-12-31' }
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /nombre.*al menos 3/i);
  });

  // -------------------------------------------------------------------------
  // PASO 7: Teléfono Requerido
  // -------------------------------------------------------------------------
  test('Paso 7 [Baby Step]: Falla si el teléfono está ausente o es demasiado corto', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: dniBase,
        nombre: 'Juan Perez',
        telefono: '123', // Menos de 6 caracteres
        licencia: { categoria: 'E1', vencimiento: '2028-12-31' }
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /teléfono.*al menos 6/i);
  });

  // -------------------------------------------------------------------------
  // PASO 8: Licencia Estricta
  // -------------------------------------------------------------------------
  test('Paso 8 [Baby Step]: Falla si falta licencia.categoria o licencia.vencimiento', async () => {
    const res = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify({
        dni: dniBase,
        nombre: 'Juan Perez',
        telefono: '+54 11 4455-6677',
        licencia: { categoria: 'E1' } // Falta vencimiento
      })
    });

    assert.equal(res.status, 400);
    assert.match(res.data.error, /licencia\.vencimiento.*obligatorio/i);
  });

  // -------------------------------------------------------------------------
  // PASO 9: Éxito con 7 u 8 cifras y Conflicto por Duplicado
  // -------------------------------------------------------------------------
  test('Paso 9 [Baby Step]: Acepta DNI válido (7 u 8 dígitos) y rechaza duplicados con 409', async () => {
    const payloadValido = {
      dni: '12345678', // 8 dígitos válido
      nombre: 'Marcelo Rodriguez',
      telefono: '+54 11 4455-6677',
      licencia: { categoria: 'E1', vencimiento: '2029-05-15' }
    };

    // 1. Inserción exitosa
    const res1 = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify(payloadValido)
    });
    assert.equal(res1.status, 201);
    assert.equal(res1.data.dni, '12345678');
    assert.equal(res1.data.estado, 'disponible');

    // 2. Segunda inserción con el mismo DNI debe fallar con 409 Conflict
    const res2 = await request('/api/choferes', {
      method: 'POST',
      body: JSON.stringify(payloadValido)
    });
    assert.equal(res2.status, 409);
    assert.match(res2.data.error, /ya existe/i);
  });
});
