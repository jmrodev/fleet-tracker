const camionesRepository = require('../repositories/camiones.repository');
const viajesRepository = require('../repositories/viajes.repository');

class StatsService {
  async obtenerMetricasFlota() {
    const totalCamiones = await camionesRepository.countTotal();
    const totalEnViaje = await camionesRepository.countByEstado('en_viaje');
    const totalMantenimiento = await camionesRepository.countByEstado('en_mantenimiento');

    const gastosPorMarca = await camionesRepository.aggregateGastosMantenimiento();

    const kmData = await viajesRepository.aggregateKmFinalizados();
    const kmTotales = kmData.length > 0 ? kmData[0].km_totales : 0;
    const viajesTotales = kmData.length > 0 ? kmData[0].viajes_totales : 0;

    return {
      total_camiones: totalCamiones,
      total_en_viaje: totalEnViaje,
      total_mantenimiento: totalMantenimiento,
      km_flota_recorridos: kmTotales,
      viajes_finalizados: viajesTotales,
      gasto_mantenimiento_por_marca: gastosPorMarca
    };
  }
}

module.exports = new StatsService();
