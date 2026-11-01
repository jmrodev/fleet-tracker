// public/js/views/flota.js - Vista de Unidades, Choferes y Mantenimiento
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';

export async function initFlotaView() {
  const formMant = document.getElementById('form-mant');
  if (formMant && !formMant.dataset.bound) {
    formMant.dataset.bound = 'true';
    formMant.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('msg-mant');
      msg.textContent = '';
      msg.className = 'error-box';

      const patente = document.getElementById('mant-camion').value;
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
        msg.textContent = '✓ Mantenimiento asentado exitosamente en hoja de vida ($push).';
        await renderFlota();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }

  await renderFlota();
}

export async function renderFlota() {
  const [camiones, choferes] = await Promise.all([
    api.getCamiones(),
    api.getChoferes()
  ]);

  renderTablaCamiones(camiones);
  renderTablaChoferes(choferes);
  actualizarSelectorMantenimiento(camiones);
}

function renderTablaCamiones(camiones) {
  const tbody = document.getElementById('camiones-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!camiones.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay camiones registrados</td></tr>';
    return;
  }

  camiones.forEach(c => {
    const mantHtml = (c.mantenimientos || []).map(m => 
      `<div>• <strong>${m.tipo}</strong> ($${m.costo.toLocaleString()} - ${m.km_servicio.toLocaleString()} km) [${m.taller}]</div>`
    ).join('') || '<em style="color:#8b949e">Sin mantenimientos asentados</em>';

    const fotoImg = c.foto_url 
      ? `<img src="${c.foto_url}" class="truck-thumb" alt="${c.patente}">`
      : `<div class="truck-thumb" style="background:#21262d; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🚛</div>`;

    tbody.innerHTML += `
      <tr>
        <td style="width: 70px;">${fotoImg}</td>
        <td><strong>${c.patente}</strong></td>
        <td>${c.marca} ${c.modelo} (${c.anio})</td>
        <td>${c.capacidad_kg.toLocaleString()} kg</td>
        <td>${c.kilometraje_actual.toLocaleString()} km</td>
        <td><span class="badge-${c.estado}">${c.estado}</span></td>
        <td>${mantHtml}</td>
      </tr>
    `;
  });
}

function renderTablaChoferes(choferes) {
  const tbody = document.getElementById('choferes-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!choferes.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay choferes registrados</td></tr>';
    return;
  }

  choferes.forEach(ch => {
    const fotoImg = ch.foto_url 
      ? `<img src="${ch.foto_url}" class="driver-thumb" alt="${ch.nombre}">`
      : `<div class="driver-thumb" style="background:#21262d; display:flex; align-items:center; justify-content:center; font-size:1rem;">👤</div>`;

    tbody.innerHTML += `
      <tr>
        <td style="width: 50px;">${fotoImg}</td>
        <td><strong>${ch.dni}</strong></td>
        <td>${ch.nombre}</td>
        <td>${ch.telefono}</td>
        <td>Licencia: ${ch.licencia.categoria} (Vence: ${ch.licencia.vencimiento})</td>
        <td><span class="badge-${ch.estado}">${ch.estado}</span></td>
      </tr>
    `;
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
