const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

// Métricas de flota vía Aggregation Pipeline
router.get('/flota', async (req, res) => {
  try {
    const db = getDB();
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

module.exports = router;
