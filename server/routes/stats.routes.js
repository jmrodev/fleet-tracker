const express = require('express');
const statsController = require('../controllers/stats.controller');

const router = express.Router();

router.get('/flota', (req, res) => statsController.obtenerFlota(req, res));

module.exports = router;
