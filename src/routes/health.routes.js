const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

router.get('/health', async (req, res) => {
  const start = Date.now();
  try {
    const db = getDB();
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - start;
    res.json({
      status: 'healthy',
      database: 'connected',
      latency_ms: latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
