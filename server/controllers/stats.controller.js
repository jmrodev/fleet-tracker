const statsService = require('../services/stats.service');

class StatsController {
  async obtenerFlota(req, res) {
    try {
      const metricas = await statsService.obtenerMetricasFlota();
      res.json(metricas);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new StatsController();
