const express = require('express');
const choferesController = require('../controllers/choferes.controller');

const router = express.Router();

router.get('/', (req, res) => choferesController.listar(req, res));
router.get('/:dni', (req, res) => choferesController.obtenerPorDni(req, res));
router.post('/', (req, res) => choferesController.crear(req, res));
router.put('/:dni', (req, res) => choferesController.actualizar(req, res));
router.delete('/:dni', (req, res) => choferesController.eliminar(req, res));

module.exports = router;
