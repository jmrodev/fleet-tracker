const express = require('express');
const viajesController = require('../controllers/viajes.controller');

const router = express.Router();

router.get('/', (req, res) => viajesController.listar(req, res));
router.post('/', (req, res) => viajesController.despachar(req, res));
router.put('/:id/finalizar', (req, res) => viajesController.finalizar(req, res));

module.exports = router;
