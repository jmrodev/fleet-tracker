// public/js/views/camiones.js - Vista dedicada de Camiones & Mantenimiento (Harden + Filtros + Modal Edición)
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';
import { openModal, closeModal, showToast, confirmAction } from '../app.js';
import { icons } from '../icons.js';

let flotaCache = [];

export async function initCamionesView() {
  bindFormNuevoCamion();
  bindFormMantenimiento();
  bindFormEditarCamion();
  bindFiltrosCamiones();
  await renderCamiones();
}

function bindFiltrosCamiones() {
  const searchInput = document.getElementById('filtro-camiones');
  const estadoSelect = document.getElementById('filtro-estado-camiones');

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', () => aplicarFiltros());
  }

  if (estadoSelect && !estadoSelect.dataset.bound) {
    estadoSelect.dataset.bound = 'true';
    estadoSelect.addEventListener('change', () => aplicarFiltros());
  }
}

function aplicarFiltros() {
  const searchEl = document.getElementById('filtro-camiones');
  const estadoEl = document.getElementById('filtro-estado-camiones');
  const search = searchEl ? searchEl.value.toLowerCase().trim() : '';
  const estado = estadoEl ? estadoEl.value.trim() : '';

  const filtrados = flotaCache.filter(c => {
    const matchSearch = search.length === 0 || 
      c.patente.toLowerCase().includes(search) || 
      c.marca.toLowerCase().includes(search) || 
      c.modelo.toLowerCase().includes(search);
    const matchEstado = estado.length === 0 || c.estado === estado;
    return matchSearch && matchEstado;
  });

  renderTablaCamiones(filtrados);
}

function bindFormNuevoCamion() {
  const form = document.getElementById('form-camion');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const msg = document.getElementById('msg-camion');
      msg.textContent = '';
      msg.className = 'error-box';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';
      }

      try {
        const payload = {
          patente: document.getElementById('camion-patente').value.toUpperCase().trim(),
          marca: document.getElementById('camion-marca').value.trim(),
          modelo: document.getElementById('camion-modelo').value.trim(),
          anio: Number(document.getElementById('camion-anio').value),
          capacidad_kg: Number(document.getElementById('camion-capacidad').value),
          kilometraje_actual: Number(document.getElementById('camion-km').value),
          foto_url: document.getElementById('camion-foto').value.trim()
        };

        await api.crearCamion(payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Camión registrado con éxito (Índice único verificado en motor).';
        showToast(`Camión ${payload.patente} incorporado exitosamente.`);
        setTimeout(() => {
          closeModal('modal-camion');
        }, 800);
        await renderCamiones();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar Camión';
        }
      }
    });
  }
}

function bindFormMantenimiento() {
  const formMant = document.getElementById('form-mant');
  if (formMant && !formMant.dataset.bound) {
    formMant.dataset.bound = 'true';
    formMant.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formMant.querySelector('button[type="submit"]');
      const msg = document.getElementById('msg-mant');
      msg.textContent = '';
      msg.className = 'error-box';

      const patente = document.getElementById('mant-camion').value;
      if (!patente) {
        msg.textContent = 'Debe seleccionar un camión de la flota.';
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Asentando en MongoDB...';
      }

      const payload = {
        tipo: document.getElementById('mant-tipo').value.trim(),
        costo: Number(document.getElementById('mant-costo').value),
        km_servicio: Number(document.getElementById('mant-km').value),
        taller: document.getElementById('mant-taller').value.trim()
      };

      try {
        await api.registrarMantenimiento(patente, payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Mantenimiento asentado exitosamente con operador $push atómico.';
        showToast(`Mantenimiento registrado para ${patente}.`);
        setTimeout(() => {
          closeModal('modal-mant');
        }, 800);
        await renderCamiones();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Asentar en Hoja de Vida';
        }
      }
    });
  }
}

function bindFormEditarCamion() {
  const formEdit = document.getElementById('form-editar-camion');
  if (formEdit && !formEdit.dataset.bound) {
    formEdit.dataset.bound = 'true';
    formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const patente = document.getElementById('edit-camion-patente').value;
      const nuevoKm = Number(document.getElementById('edit-camion-km').value);
      const nuevoEstado = document.getElementById('edit-camion-estado').value;
      const msg = document.getElementById('msg-edit-camion');
      msg.textContent = '';
      msg.className = 'error-box';

      try {
        await api.actualizarCamion(patente, {
          kilometraje_actual: nuevoKm,
          estado: nuevoEstado
        });
        showToast(`Camión ${patente} actualizado.`);
        closeModal('modal-editar-camion');
        await renderCamiones();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }
}

export async function renderCamiones() {
  const tbody = document.getElementById('camiones-body');
  if (tbody && !flotaCache.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="padding: 24px;">
          <div class="skeleton-line" style="width: 100%;"></div>
          <div class="skeleton-line" style="width: 90%;"></div>
          <div class="skeleton-line" style="width: 95%;"></div>
        </td>
      </tr>
    `;
  }

  flotaCache = await api.getCamiones();
  aplicarFiltros();
  actualizarSelectorMantenimiento(flotaCache);
}

function renderTablaCamiones(camiones) {
  const tbody = document.getElementById('camiones-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!camiones.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon" style="color:var(--text-muted);">${icons.truck}</div>
          <div class="empty-state-text">No se encontraron camiones registrados o coincidentes con los filtros aplicados.</div>
        </td>
      </tr>
    `;
    return;
  }

  camiones.forEach(c => {
    const mantenimientos = Array.isArray(c.mantenimientos) ? c.mantenimientos : [];
    const count = mantenimientos.length;
    const totalCosto = mantenimientos.reduce((acc, m) => acc + (typeof m.costo === 'number' ? m.costo : 0), 0);

    let mantCellHtml = '';
    if (count === 0) {
      mantCellHtml = '<span style="color:var(--text-muted); font-size:12px;">Sin intervenciones</span>';
    } else {
      mantCellHtml = `
        <button type="button" class="badge-mant-summary btn-ver-mant" data-patente="${c.patente}" title="Ver historial detallado de ${c.patente}">
          ${icons.wrench}
          <strong>${count} ${count === 1 ? 'servicio' : 'servicios'}</strong>
          <span style="color:var(--blue-text); font-family:var(--font-mono); font-size:11px;">($${totalCosto.toLocaleString()})</span>
        </button>
      `;
    }

    const fotoImg = c.foto_url 
      ? `<img src="${c.foto_url}" class="truck-thumb" alt="${c.patente}" loading="lazy">`
      : `<div class="truck-thumb" style="display:flex; align-items:center; justify-content:center; color:var(--text-muted);">${icons.truck}</div>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 58px;">${fotoImg}</td>
      <td><strong style="font-family: var(--font-mono);">${c.patente}</strong></td>
      <td>${c.marca} ${c.modelo} (${c.anio})</td>
      <td style="font-family: var(--font-mono);">${c.capacidad_kg.toLocaleString()} kg</td>
      <td style="font-family: var(--font-mono);">${c.kilometraje_actual.toLocaleString()} km</td>
      <td><span class="badge-${c.estado}">${c.estado}</span></td>
      <td>${mantCellHtml}</td>
      <td style="white-space: nowrap;">
        <button class="btn-secondary btn-with-icon btn-edit-camion" style="padding: 4px 8px; font-size: 11px;">
          ${icons.edit}
          Editar
        </button>
        <button class="btn-danger btn-with-icon btn-del-camion" style="padding: 4px 8px; font-size: 11px;">
          ${icons.trash}
          Eliminar
        </button>
      </td>
    `;

    const btnVerMant = tr.querySelector('.btn-ver-mant');
    if (btnVerMant) {
      btnVerMant.addEventListener('click', () => mostrarHistorialMantenimiento(c));
    }

    tr.querySelector('.btn-edit-camion').addEventListener('click', () => abrirModalEdicion(c));
    tr.querySelector('.btn-del-camion').addEventListener('click', () => borrarCamion(c.patente));
    tbody.appendChild(tr);
  });
}

function mostrarHistorialMantenimiento(camion) {
  const modal = document.getElementById('modal-historial-mant');
  if (!modal) return;

  const titulo = document.getElementById('modal-historial-titulo');
  const subtitulo = document.getElementById('modal-historial-subtitulo');
  const container = document.getElementById('modal-historial-content');
  const btnNuevo = document.getElementById('btn-modal-historial-nuevo');

  if (titulo) titulo.textContent = `Hoja de Vida: ${camion.patente}`;
  if (subtitulo) subtitulo.textContent = `${camion.marca} ${camion.modelo} (${camion.anio}) — Odómetro actual: ${camion.kilometraje_actual.toLocaleString()} km`;

  const mantenimientos = Array.isArray(camion.mantenimientos) ? camion.mantenimientos : [];
  if (container) {
    if (mantenimientos.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 12px; color: var(--text-muted);">
          <div style="margin-bottom: 8px;">${icons.wrench}</div>
          <div>No se registran intervenciones de mantenimiento para esta unidad.</div>
        </div>
      `;
    } else {
      const itemsHtml = mantenimientos.map((m) => {
        const fechaStr = m.fecha ? new Date(m.fecha).toLocaleDateString() : 'Fecha no especificada';
        const tipoStr = m.tipo ? m.tipo : 'Intervención';
        const tallerStr = m.taller ? m.taller : 'Taller no especificado';
        const costoNum = typeof m.costo === 'number' ? m.costo : 0;
        const kmNum = typeof m.km_servicio === 'number' ? m.km_servicio : 0;
        return `
          <div class="mant-item-card">
            <div class="mant-item-header">
              <strong>${tipoStr}</strong>
              <span class="mant-item-cost">$${costoNum.toLocaleString()}</span>
            </div>
            <div class="mant-item-meta">
              <span>📅 ${fechaStr}</span>
              <span>🛣️ ${kmNum.toLocaleString()} km</span>
              <span>🏢 ${tallerStr}</span>
            </div>
            ${m.detalles ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">📝 ${m.detalles}</div>` : ''}
          </div>
        `;
      }).reverse().join('');
      container.innerHTML = itemsHtml;
    }
  }

  if (btnNuevo) {
    btnNuevo.onclick = () => {
      closeModal('modal-historial-mant');
      const selCamion = document.getElementById('mant-camion');
      if (selCamion) {
        selCamion.value = camion.patente;
      }
      openModal('modal-mant');
    };
  }

  openModal('modal-historial-mant');
}

function abrirModalEdicion(c) {
  const patenteInput = document.getElementById('edit-camion-patente');
  const kmInput = document.getElementById('edit-camion-km');
  const estadoSelect = document.getElementById('edit-camion-estado');
  const title = document.getElementById('modal-edit-camion-title');
  const msg = document.getElementById('msg-edit-camion');

  if (patenteInput) patenteInput.value = c.patente;
  if (kmInput) kmInput.value = c.kilometraje_actual;
  if (estadoSelect) estadoSelect.value = c.estado;
  if (title) title.textContent = `Actualizar Camión ${c.patente}`;
  if (msg) {
    msg.textContent = '';
    msg.className = 'error-box';
  }

  openModal('modal-editar-camion');
}

function borrarCamion(patente) {
  confirmAction({
    title: `Eliminar Camión ${patente}`,
    message: `¿Está seguro de dar de baja la unidad con patente ${patente}? Esta operación quitará el vehículo de la flota activa.`,
    confirmText: 'Dar de Baja',
    onConfirm: async () => {
      try {
        await api.eliminarCamion(patente);
        showToast(`Camión ${patente} eliminado.`);
        await renderCamiones();
        await renderKPIs();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });
}

function actualizarSelectorMantenimiento(camiones) {
  const sel = document.getElementById('mant-camion');
  if (!sel) return;

  sel.innerHTML = '<option value="">Seleccione camión...</option>';
  camiones.forEach(c => {
    sel.innerHTML += `<option value="${c.patente}">${c.patente} - ${c.marca} ${c.modelo} (${c.kilometraje_actual.toLocaleString()} km)</option>`;
  });
}
