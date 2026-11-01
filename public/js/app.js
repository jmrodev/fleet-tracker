// public/js/app.js - Orquestador y Navegación entre Vistas
import { renderKPIs } from './views/kpis.js';
import { initViajesView, renderViajes } from './views/viajes.js';
import { initFlotaView, renderFlota } from './views/flota.js';
import { renderStats } from './views/stats.js';

function setupTabNavigation() {
  const tabs = document.querySelectorAll('.view-tab');
  const views = document.querySelectorAll('.tab-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetView = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      tab.classList.add('active');
      const activeEl = document.getElementById(`view-${targetView}`);
      if (activeEl) activeEl.classList.add('active');

      // Cargar o refrescar vista específica
      if (targetView === 'viajes') renderViajes();
      if (targetView === 'flota') renderFlota();
      if (targetView === 'stats') renderStats();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupTabNavigation();

  // Inicializar componentes
  await renderKPIs();
  await initViajesView();
  await initFlotaView();
  await renderStats();

  const btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      await renderKPIs();
      await renderViajes();
      await renderFlota();
      await renderStats();
    });
  }
});
