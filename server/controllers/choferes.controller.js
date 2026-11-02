const choferesService = require('../services/choferes.service');

class ChoferesController {
  async listar(req, res) {
    try {
      const choferes = await choferesService.listarChoferes(
        req.query.estado,
        req.query.skip,
        req.query.limit
      );
      res.json(choferes);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async obtenerPorDni(req, res) {
    try {
      const chofer = await choferesService.obtenerChofer(req.params.dni);
      res.json(chofer);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async crear(req, res) {
    try {
      const choferCreado = await choferesService.crearChofer(req.body);
      res.status(201).json(choferCreado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async actualizar(req, res) {
    try {
      const choferActualizado = await choferesService.actualizarChofer(req.params.dni, req.body);
      res.json(choferActualizado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async eliminar(req, res) {
    try {
      const resultado = await choferesService.eliminarChofer(req.params.dni);
      res.json(resultado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new ChoferesController();
