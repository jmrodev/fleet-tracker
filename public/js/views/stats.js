// public/js/views/stats.js - Vista Analítica del Aggregation Pipeline
import { api } from '../api.js';

export async function renderStats() {
  const container = document.getElementById('gastos-tabla');
  if (!container) return;

  try {
    const data = await api.getStats();

    if (!data.gasto_mantenimiento_por_marca || data.gasto_mantenimiento_por_marca.length === 0) {
      container.innerHTML = '<p style="color:#8b949e">Sin servicios registrados aún en el motor.</p>';
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Marca de Camión</th>
            <th>Órdenes de Servicio</th>
            <th>Gasto Total Acumulado</th>
            <th>Costo Promedio / Servicio</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.gasto_mantenimiento_por_marca.forEach(g => {
      html += `
        <tr>
          <td><strong>${g._id}</strong></td>
          <td>${g.servicios}</td>
          <td>$${g.total_gastado.toLocaleString()}</td>
          <td>$${Math.round(g.costo_promedio).toLocaleString()}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color:#f85149">Error cargando métricas: ${err.message}</p>`;
  }
}
