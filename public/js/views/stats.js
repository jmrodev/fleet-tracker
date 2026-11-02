// public/js/views/stats.js - Vista Analítica del Aggregation Pipeline
import { api } from '../api.js';

export async function renderStats() {
  const containerDashboard = document.getElementById('gastos-tabla');
  const containerFull = document.getElementById('gastos-tabla-clone');

  try {
    const data = await api.getStats();

    if (!data.gasto_mantenimiento_por_marca || data.gasto_mantenimiento_por_marca.length === 0) {
      const emptyHtml = '<p style="color:#8b949e">Sin servicios registrados aún en el motor.</p>';
      if (containerDashboard) containerDashboard.innerHTML = emptyHtml;
      if (containerFull) containerFull.innerHTML = emptyHtml;
      return;
    }

    // Calcular totales globales para el reporte
    const totalGastoGlobal = data.gasto_mantenimiento_por_marca.reduce((acc, curr) => {
      const gasto = typeof curr.total_gastado === 'number' ? curr.total_gastado : 0;
      return acc + gasto;
    }, 0);
    const totalServiciosGlobal = data.gasto_mantenimiento_por_marca.reduce((acc, curr) => {
      const serv = typeof curr.servicios === 'number' ? curr.servicios : 0;
      return acc + serv;
    }, 0);
    const promedioGeneral = totalServiciosGlobal > 0 ? Math.round(totalGastoGlobal / totalServiciosGlobal) : 0;

    // Tabla Resumen para Dashboard
    let htmlDashboard = `
      <table>
        <thead>
          <tr>
            <th>Marca</th>
            <th>Servicios</th>
            <th>Gasto Total</th>
            <th>Promedio / Serv</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.gasto_mantenimiento_por_marca.forEach(g => {
      htmlDashboard += `
        <tr>
          <td><strong>${g._id}</strong></td>
          <td>${g.servicios}</td>
          <td>$${g.total_gastado.toLocaleString()}</td>
          <td>$${Math.round(g.costo_promedio).toLocaleString()}</td>
        </tr>
      `;
    });

    htmlDashboard += '</tbody></table>';

    if (containerDashboard) {
      containerDashboard.innerHTML = htmlDashboard;
    }

    // Reporte Detallado con KPI resumen para la pestaña Analítica
    if (containerFull) {
      let htmlFull = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
          <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #8b949e; letter-spacing: 0.5px;">Gasto Total en Taller</div>
            <div style="font-size: 20px; font-weight: 700; color: #f0883e; margin-top: 4px;">$${totalGastoGlobal.toLocaleString()}</div>
          </div>
          <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #8b949e; letter-spacing: 0.5px;">Órdenes Ejecutadas</div>
            <div style="font-size: 20px; font-weight: 700; color: #58a6ff; margin-top: 4px;">${totalServiciosGlobal} intervenciones</div>
          </div>
          <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #8b949e; letter-spacing: 0.5px;">Costo Medio por Servicio</div>
            <div style="font-size: 20px; font-weight: 700; color: #3fb950; margin-top: 4px;">$${promedioGeneral.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Marca de Camión</th>
              <th>Intervenciones en Taller</th>
              <th>Inversión Total Acumulada</th>
              <th>Costo Promedio por Intervención</th>
              <th>Participación Presupuestaria</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.gasto_mantenimiento_por_marca.forEach(g => {
        const participacion = totalGastoGlobal > 0 ? ((g.total_gastado / totalGastoGlobal) * 100).toFixed(1) : '0';
        htmlFull += `
          <tr>
            <td><strong style="color: #58a6ff; font-size: 14px;">${g._id}</strong></td>
            <td>${g.servicios} servicio(s)</td>
            <td style="font-weight: 600;">$${g.total_gastado.toLocaleString()}</td>
            <td>$${Math.round(g.costo_promedio).toLocaleString()}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="flex: 1; background: #21262d; border-radius: 4px; height: 8px; overflow: hidden;">
                  <div style="background: #f0883e; width: ${participacion}%; height: 100%;"></div>
                </div>
                <span style="font-size: 12px; color: #8b949e; width: 45px;">${participacion}%</span>
              </div>
            </td>
          </tr>
        `;
      });

      htmlFull += '</tbody></table>';
      containerFull.innerHTML = htmlFull;
    }

  } catch (err) {
    const errorHtml = `<p style="color:#f85149">Error cargando métricas: ${err.message}</p>`;
    if (containerDashboard) containerDashboard.innerHTML = errorHtml;
    if (containerFull) containerFull.innerHTML = errorHtml;
  }
}
