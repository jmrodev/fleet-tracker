const express = require('express');
const path = require('path');
const { connectDB } = require('./src/config/db');

const healthRoutes = require('./src/routes/health.routes');
const camionesRoutes = require('./src/routes/camiones.routes');
const choferesRoutes = require('./src/routes/choferes.routes');
const viajesRoutes = require('./src/routes/viajes.routes');
const statsRoutes = require('./src/routes/stats.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Registro modular de rutas
app.use('/api', healthRoutes);
app.use('/api/camiones', camionesRoutes);
app.use('/api/choferes', choferesRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/stats', statsRoutes);

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[INFO] Sistema de Flota corriendo en: http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
