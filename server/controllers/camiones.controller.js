const camionesService = require('../services/camiones.service');

class CamionesController {
  async listar(req, res) {
    try {
      const camiones = await camionesService.listarCamiones(
        req.query.estado,
        req.query.skip,
        req.query.limit
      );
      res.json(camiones);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async obtenerPorPatente(req, res) {
    try {
      const camion = await camionesService.obtenerCamion(req.params.patente);
      res.json(camion);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async crear(req, res) {
    try {
      const camionCreado = await camionesService.crearCamion(req.body);
      res.status(201).json(camionCreado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async actualizar(req, res) {
    try {
      const camionActualizado = await camionesService.actualizarCamion(req.params.patente, req.body);
      res.json(camionActualizado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async eliminar(req, res) {
    try {
      const resultado = await camionesService.eliminarCamion(req.params.patente);
      res.json(resultado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async agregarMantenimiento(req, res) {
    try {
      const resultado = await camionesService.registrarMantenimiento(req.params.patente, req.body);
      res.json(resultado);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new CamionesController();
