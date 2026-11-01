// public/js/views/flota.js - Vista de Unidades, Choferes y Mantenimiento con CRUD Completo
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';

export async function initFlotaView() {
  bindFormNuevoCamion();
  bindFormNuevoChofer();
  bindFormMantenimiento();
  await renderFlota();
}

function bindFormNuevoCamion() {
  const form = document.getElementById('form-camion');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('msg-camion');
      msg.textContent = '';
      msg.className = 'error-box';

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
        msg.textContent = '✓ Camión registrado con éxito (Índice único verificado).';
        await renderFlota();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      }
    });
  }
}

function bindFormNuevoChofer() {
  const form = document.getElementById('form-chofer');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('msg-chofer');
      msg.textContent = '';
      msg.className = 'error-box';

      try {
        const payload = {
          dni: document.getElementById('chofer-dni').value,
          nombre: document.getElementById('chofer-nombre').value,
          telefono: document.getElementById('chofer-tel').value,
          licencia: {
            categoria: document.getElementById('chofer-lic-cat').value,
            vencimiento: document.getElementById('chofer-lic-venc').value
          },
          foto_url: document.getElementById('chofer-foto').value
        };

        await api.crearChofer(payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Chofer dado de alta con éxito (Índice único verificado).';
        await renderFlota();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
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
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay camiones registrados</td></tr>';
    return;
  }

  camiones.forEach(c => {
    const mantHtml = (c.mantenimientos || []).map(m => 
      `<div>• <strong>${m.tipo}</strong> ($${m.costo.toLocaleString()} - ${m.km_servicio.toLocaleString()} km) [${m.taller}]</div>`
    ).join('') || '<em style="color:#8b949e">Sin mantenimientos</em>';

    const fotoImg = c.foto_url 
      ? `<img src="${c.foto_url}" class="truck-thumb" alt="${c.patente}">`
      : `<div class="truck-thumb" style="background:#21262d; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🚛</div>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 70px;">${fotoImg}</td>
      <td><strong>${c.patente}</strong></td>
      <td>${c.marca} ${c.modelo} (${c.anio})</td>
      <td>${c.capacidad_kg.toLocaleString()} kg</td>
      <td>${c.kilometraje_actual.toLocaleString()} km</td>
      <td><span class="badge-${c.estado}">${c.estado}</span></td>
      <td>${mantHtml}</td>
      <td style="white-space: nowrap;">
        <button class="btn-secondary btn-edit-camion" style="padding: 4px 8px; font-size: 11px;">✏️</button>
        <button class="btn-danger btn-del-camion" style="padding: 4px 8px; font-size: 11px; background:#da3633; color:#fff;">🗑️</button>
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
    await renderFlota();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}

async function borrarCamion(patente) {
  if (!confirm(`¿Está seguro de eliminar el camión con patente ${patente}?`)) return;
  try {
    await api.eliminarCamion(patente);
    await renderFlota();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}

function renderTablaChoferes(choferes) {
  const tbody = document.getElementById('choferes-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!choferes.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay choferes registrados</td></tr>';
    return;
  }

  choferes.forEach(ch => {
    const fotoImg = ch.foto_url 
      ? `<img src="${ch.foto_url}" class="driver-thumb" alt="${ch.nombre}">`
      : `<div class="driver-thumb" style="background:#21262d; display:flex; align-items:center; justify-content:center; font-size:1rem;">👤</div>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 50px;">${fotoImg}</td>
      <td><strong>${ch.dni}</strong></td>
      <td>${ch.nombre}</td>
      <td>${ch.telefono}</td>
      <td>Licencia: ${ch.licencia.categoria} (Vence: ${ch.licencia.vencimiento})</td>
      <td><span class="badge-${ch.estado}">${ch.estado}</span></td>
      <td style="white-space: nowrap;">
        <button class="btn-secondary btn-edit-chofer" style="padding: 4px 8px; font-size: 11px;">✏️</button>
        <button class="btn-danger btn-del-chofer" style="padding: 4px 8px; font-size: 11px; background:#da3633; color:#fff;">🗑️</button>
      </td>
    `;

    tr.querySelector('.btn-edit-chofer').addEventListener('click', () => editarChofer(ch));
    tr.querySelector('.btn-del-chofer').addEventListener('click', () => borrarChofer(ch.dni));
    tbody.appendChild(tr);
  });
}

async function editarChofer(ch) {
  const nuevoTel = prompt(`Actualizar teléfono para ${ch.nombre}:`, ch.telefono);
  if (nuevoTel === null) return;

  const nuevoEstado = prompt(`Actualizar estado (disponible / asignado / descanso):`, ch.estado);
  if (nuevoEstado === null) return;

  try {
    await api.actualizarChofer(ch.dni, {
      telefono: nuevoTel.trim(),
      estado: nuevoEstado.trim()
    });
    await renderFlota();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}

async function borrarChofer(dni) {
  if (!confirm(`¿Está seguro de dar de baja al chofer con DNI ${dni}?`)) return;
  try {
    await api.eliminarChofer(dni);
    await renderFlota();
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
