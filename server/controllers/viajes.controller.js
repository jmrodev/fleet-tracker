const viajesService = require('../services/viajes.service');

class ViajesController {
  async listar(req, res) {
    try {
      const viajes = await viajesService.listarViajes(
        req.query.estado,
        req.query.skip,
        req.query.limit
      );
      res.json(viajes);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async despachar(req, res) {
    try {
      const viajeCreado = await viajesService.despacharViaje(req.body);
      res.status(201).json(viajeCreado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async finalizar(req, res) {
    try {
      const resultado = await viajesService.finalizarViaje(req.params.id, req.body);
      res.json(resultado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new ViajesController();
