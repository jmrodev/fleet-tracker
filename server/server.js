const express = require('express');
const path = require('path');
const { connectDB } = require('./config/db');

const healthRoutes = require('./routes/health.routes');
const camionesRoutes = require('./routes/camiones.routes');
const choferesRoutes = require('./routes/choferes.routes');
const viajesRoutes = require('./routes/viajes.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Servir cliente desacoplado desde client/
app.use(express.static(path.join(__dirname, '..', 'client')));

// Registro modular de rutas
app.use('/api', healthRoutes);
app.use('/api/camiones', camionesRoutes);
app.use('/api/choferes', choferesRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/stats', statsRoutes);

async function startServer(retries = 5, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`[INFO] Sistema de Flota corriendo en: http://localhost:${PORT}`);
      });
      return;
    } catch (err) {
      console.error(`[WARN] Intento ${i}/${retries} fallido al conectar con MongoDB: ${err.message}`);
      if (i === retries) {
        console.error('[FATAL] Se agotaron los reintentos de conexión. Saliendo...');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
