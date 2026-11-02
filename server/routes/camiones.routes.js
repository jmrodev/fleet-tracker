const express = require('express');
const camionesController = require('../controllers/camiones.controller');

const router = express.Router();

router.get('/', (req, res) => camionesController.listar(req, res));
router.get('/:patente', (req, res) => camionesController.obtenerPorPatente(req, res));
router.post('/', (req, res) => camionesController.crear(req, res));
router.put('/:patente', (req, res) => camionesController.actualizar(req, res));
router.delete('/:patente', (req, res) => camionesController.eliminar(req, res));
router.post('/:patente/mantenimientos', (req, res) => camionesController.agregarMantenimiento(req, res));

module.exports = router;
