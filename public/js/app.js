// public/js/app.js - Orquestador y Gestión de Vistas, Modales y Toasts
import { renderKPIs } from './views/kpis.js';
import { initViajesView, renderViajes } from './views/viajes.js';
import { initCamionesView, renderCamiones } from './views/camiones.js';
import { initChoferesView, renderChoferes } from './views/choferes.js';
import { renderStats } from './views/stats.js';

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    const firstInput = modal.querySelector('input:not([type="hidden"]), select');
    if (firstInput) firstInput.focus();
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function setupModals() {
  // Botones de apertura
  const btnViaje = document.getElementById('btn-open-modal-viaje');
  const btnViajeDash = document.getElementById('btn-open-modal-viaje-dash');
  const btnCamion = document.getElementById('btn-open-modal-camion');
  const btnMant = document.getElementById('btn-open-modal-mant');
  const btnChofer = document.getElementById('btn-open-modal-chofer');

  if (btnViaje) btnViaje.addEventListener('click', () => openModal('modal-viaje'));
  if (btnViajeDash) btnViajeDash.addEventListener('click', () => openModal('modal-viaje'));
  if (btnCamion) btnCamion.addEventListener('click', () => openModal('modal-camion'));
  if (btnMant) btnMant.addEventListener('click', () => openModal('modal-mant'));
  if (btnChofer) btnChofer.addEventListener('click', () => openModal('modal-chofer'));

  // Botones de cierre (data-close="modal-id")
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      closeModal(targetId);
    });
  });

  // Cerrar al hacer clic en el backdrop exterior
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    }
  });
}

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
      if (targetView === 'camiones') renderCamiones();
      if (targetView === 'choferes') renderChoferes();
      if (targetView === 'stats') renderStats();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupTabNavigation();
  setupModals();

  // Inicializar componentes modulares
  await renderKPIs();
  await initViajesView();
  await initCamionesView();
  await initChoferesView();
  await renderStats();

  const btnRefresh = document.getElementById('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      await renderKPIs();
      await renderViajes();
      await renderCamiones();
      await renderChoferes();
      await renderStats();
    });
  }
});
