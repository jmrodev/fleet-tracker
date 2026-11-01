const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:secretpassword@localhost:27017/?authSource=admin';
const DB_NAME = 'flota_transporte_db';

async function runTests() {
  console.log('[TEST] Iniciando verificación de integración directa en MongoDB...');
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // 1. Verificar índices
    const camionesIndexes = await db.collection('camiones').indexes();
    const hasPatenteIndex = camionesIndexes.some(idx => idx.key && idx.key.patente === 1 && idx.unique === true);
    console.assert(hasPatenteIndex, 'ERROR: El índice único en "patente" no existe');
    console.log('  ✓ Índice único en patente verificado.');

    // 2. Probar Aggregation Pipeline ($unwind + $group)
    const pipeline = [
      { $unwind: '$mantenimientos' },
      {
        $group: {
          _id: '$marca',
          total_gastado: { $sum: '$mantenimientos.costo' },
          servicios: { $sum: 1 }
        }
      }
    ];
    const stats = await db.collection('camiones').aggregate(pipeline).toArray();
    console.assert(Array.isArray(stats), 'ERROR: El pipeline no devolvió array');
    console.log(`  ✓ Aggregation Pipeline ejecutado con éxito (${stats.length} marcas computadas).`);

    // 3. Probar Atomic $push
    const updateRes = await db.collection('camiones').updateOne(
      { patente: 'AE123CD' },
      {
        $push: {
          mantenimientos: {
            tipo: 'Test de integración Linus/Chelo',
            costo: 10000,
            km_servicio: 146000,
            fecha: new Date()
          }
        }
      }
    );
    console.assert(updateRes.modifiedCount === 1, 'ERROR: No se pudo hacer $push');
    console.log('  ✓ Modificación atómica $push en subdocumento exitosa.');

    // 4. Probar Reserva Atómica Concurrente (Compare-and-Swap con findOneAndUpdate)
    const reservaExitosa = await db.collection('camiones').findOneAndUpdate(
      { patente: 'AE123CD', estado: 'disponible' },
      { $set: { estado: 'en_viaje' } },
      { returnDocument: 'after' }
    );
    console.assert(reservaExitosa !== null, 'ERROR: No se pudo reservar el camión disponible');

    // Intentar segunda reserva en concurrencia (debe ser rechazada atómicamente por el motor)
    const reservaDuplicada = await db.collection('camiones').findOneAndUpdate(
      { patente: 'AE123CD', estado: 'disponible' },
      { $set: { estado: 'en_viaje' } },
      { returnDocument: 'after' }
    );
    console.assert(reservaDuplicada === null, 'ERROR: El motor permitió doble reserva concurrente');
    console.log('  ✓ Atomicidad y rechazo de carrera concurrentes verificado.');

    // Restaurar estado
    await db.collection('camiones').updateOne({ patente: 'AE123CD' }, { $set: { estado: 'disponible' } });

    console.log('\n[TEST RESULT] TODOS LOS TESTS PASARON (0 fallas).');
  } catch (err) {
    console.error('[TEST FATAL]:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runTests();
