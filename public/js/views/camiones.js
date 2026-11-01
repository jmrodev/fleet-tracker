// public/js/views/camiones.js - Vista dedicada de Camiones & Mantenimiento (Harden)
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';

export async function initCamionesView() {
  bindFormNuevoCamion();
  bindFormMantenimiento();
  await renderCamiones();
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
          patente: document.getElementById('camion-patente').value,
          marca: document.getElementById('camion-marca').value,
          modelo: document.getElementById('camion-modelo').value,
          anio: Number(document.getElementById('camion-anio').value),
          capacidad_kg: Number(document.getElementById('camion-capacidad').value),
          kilometraje_actual: Number(document.getElementById('camion-km').value || 0),
          foto_url: document.getElementById('camion-foto').value
        };

        await api.crearCamion(payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Camión registrado con éxito (Índice único verificado en motor).';
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
        tipo: document.getElementById('mant-tipo').value,
        costo: Number(document.getElementById('mant-costo').value),
        km_servicio: Number(document.getElementById('mant-km').value),
        taller: document.getElementById('mant-taller').value
      };

      try {
        await api.registrarMantenimiento(patente, payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Mantenimiento asentado exitosamente en hoja de vida ($push atómico).';
        await renderCamiones();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Asentar en Hoja de Vida Embebida';
        }
      }
    });
  }
}

export async function renderCamiones() {
  const camiones = await api.getCamiones();
  renderTablaCamiones(camiones);
  actualizarSelectorMantenimiento(camiones);
}

function renderTablaCamiones(camiones) {
  const tbody = document.getElementById('camiones-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!camiones.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">🚚</div>
          <div class="empty-state-text">No hay camiones registrados en la base de datos. Utilice el formulario superior para incorporar unidades.</div>
        </td>
      </tr>
    `;
    return;
  }

  camiones.forEach(c => {
    const mantHtml = (c.mantenimientos || []).map(m => 
      `<div class="truncate-cell" title="${m.tipo} ($${m.costo.toLocaleString()} - ${m.km_servicio.toLocaleString()} km) [${m.taller}]">• <strong>${m.tipo}</strong> ($${m.costo.toLocaleString()}) [${m.taller}]</div>`
    ).join('') || '<em style="color:var(--text-muted)">Sin intervenciones</em>';

    const fotoImg = c.foto_url 
      ? `<img src="${c.foto_url}" class="truck-thumb" alt="${c.patente}" loading="lazy">`
      : `<div class="truck-thumb" style="display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🚛</div>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 58px;">${fotoImg}</td>
      <td><strong style="font-family: var(--font-mono);">${c.patente}</strong></td>
      <td>${c.marca} ${c.modelo} (${c.anio})</td>
      <td style="font-family: var(--font-mono);">${c.capacidad_kg.toLocaleString()} kg</td>
      <td style="font-family: var(--font-mono);">${c.kilometraje_actual.toLocaleString()} km</td>
      <td><span class="badge-${c.estado}">${c.estado}</span></td>
      <td>${mantHtml}</td>
      <td style="white-space: nowrap;">
        <button class="btn-secondary btn-edit-camion" style="padding: 4px 8px; font-size: 11px;">✏️ Editar</button>
        <button class="btn-danger btn-del-camion" style="padding: 4px 8px; font-size: 11px;">🗑️ Eliminar</button>
      </td>
    `;

    tr.querySelector('.btn-edit-camion').addEventListener('click', () => editarCamion(c));
    tr.querySelector('.btn-del-camion').addEventListener('click', () => borrarCamion(c.patente));
    tbody.appendChild(tr);
  });
}

async function editarCamion(c) {
  const nuevoKm = prompt(`Actualizar odómetro para camión ${c.patente} (Actual: ${c.kilometraje_actual} km):`, c.kilometraje_actual);
  if (nuevoKm === null) return;

  const nuevoEstado = prompt(`Actualizar estado (disponible / en_mantenimiento / en_viaje):`, c.estado);
  if (nuevoEstado === null) return;

  try {
    await api.actualizarCamion(c.patente, {
      kilometraje_actual: Number(nuevoKm),
      estado: nuevoEstado.trim()
    });
    await renderCamiones();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}

async function borrarCamion(patente) {
  if (!confirm(`¿Está seguro de eliminar el camión con patente ${patente}?`)) return;
  try {
    await api.eliminarCamion(patente);
    await renderCamiones();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}

function actualizarSelectorMantenimiento(camiones) {
  const sel = document.getElementById('mant-camion');
  if (!sel) return;

  sel.innerHTML = '<option value="">Seleccione camión...</option>';
  camiones.forEach(c => {
    sel.innerHTML += `<option value="${c.patente}">${c.patente} - ${c.marca} ${c.modelo} (${c.kilometraje_actual.toLocaleString()} km)</option>`;
  });
}
