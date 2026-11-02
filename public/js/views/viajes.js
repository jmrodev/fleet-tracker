// public/js/views/viajes.js - Vista de Despacho y Seguimiento de Viajes (Harden + Modales + Toasts)
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';
import { openModal, closeModal, showToast } from '../app.js';
import { icons } from '../icons.js';

export async function initViajesView() {
  bindFormViaje();
  bindFormFinalizarViaje();
  await renderViajes();
}

function bindFormViaje() {
  const formViaje = document.getElementById('form-viaje');
  if (formViaje && !formViaje.dataset.bound) {
    formViaje.dataset.bound = 'true';
    formViaje.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formViaje.querySelector('button[type="submit"]');
      const msg = document.getElementById('msg-viaje');
      msg.textContent = '';
      msg.className = 'error-box';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Despachando unidad...';
      }

      try {
        const payload = {
          camion_patente: document.getElementById('viaje-camion').value,
          chofer_dni: document.getElementById('viaje-chofer').value,
          origen: document.getElementById('viaje-origen').value.trim(),
          destino: document.getElementById('viaje-destino').value.trim(),
          carga_descripcion: document.getElementById('viaje-carga').value.trim(),
          peso_kg: Number(document.getElementById('viaje-peso').value)
        };

        await api.despacharViaje(payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Viaje despachado y registrado atómicamente.';
        showToast(`Unidad ${payload.camion_patente} despachada hacia ${payload.destino}.`);
        setTimeout(() => {
          closeModal('modal-viaje');
        }, 800);
        await renderViajes();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmar y Despachar';
        }
      }
    });
  }
}

function bindFormFinalizarViaje() {
  const formFin = document.getElementById('form-finalizar-viaje');
  if (formFin && !formFin.dataset.bound) {
    formFin.dataset.bound = 'true';
    formFin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('fin-viaje-id').value;
      const kmLlegada = Number(document.getElementById('fin-viaje-km').value);
      const obs = document.getElementById('fin-viaje-obs').value.trim();

      try {
        await api.finalizarViaje(id, {
          km_llegada: kmLlegada,
          observaciones: obs
        });
        showToast('Viaje finalizado y asentado exitosamente.');
        closeModal('modal-finalizar-viaje');
        await renderViajes();
        await renderKPIs();
      } catch (err) {
        const msg = document.getElementById('msg-fin-viaje');
        if (msg) msg.textContent = err.message;
      }
    });
  }
}

export async function renderViajes() {
  await actualizarSelectores();
  await renderTablaViajes();
}

async function actualizarSelectores() {
  const selCamion = document.getElementById('viaje-camion');
  const selChofer = document.getElementById('viaje-chofer');

  if (selCamion) {
    const camiones = await api.getCamiones('disponible');
    selCamion.innerHTML = '<option value="">Seleccione camión disponible...</option>';
    if (camiones.length === 0) {
      selCamion.innerHTML = '<option value="">⚠️ No hay camiones disponibles en este momento</option>';
    } else {
      camiones.forEach(c => {
        selCamion.innerHTML += `<option value="${c.patente}">${c.patente} - ${c.marca} ${c.modelo} (Cap: ${c.capacidad_kg.toLocaleString()} kg)</option>`;
      });
    }
  }

  if (selChofer) {
    const choferes = await api.getChoferes('disponible');
    selChofer.innerHTML = '<option value="">Seleccione chofer disponible...</option>';
    if (choferes.length === 0) {
      selChofer.innerHTML = '<option value="">⚠️ No hay choferes disponibles en este momento</option>';
    } else {
      choferes.forEach(ch => {
        selChofer.innerHTML += `<option value="${ch.dni}">${ch.nombre} (DNI: ${ch.dni})</option>`;
      });
    }
  }
}

async function renderTablaViajes() {
  const tbodies = [
    document.getElementById('viajes-body'),
    document.getElementById('viajes-body-dedicated')
  ].filter(Boolean);

  if (tbodies.length === 0) return;

  try {
    const viajes = await api.getViajes('en_curso');

    tbodies.forEach(tbody => {
      tbody.innerHTML = '';

      if (viajes.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="empty-state">
              <div class="empty-state-icon" style="color:var(--text-muted);">${icons.route}</div>
              <div class="empty-state-text">No hay unidades en tránsito inmediato hacia destino.</div>
            </td>
          </tr>
        `;
        return;
      }

      viajes.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong style="font-family: var(--font-mono);">${v.camion_patente}</strong></td>
          <td>${v.chofer_nombre}</td>
          <td class="truncate-cell" title="${v.origen} ➔ ${v.destino}">${v.origen} ➔ ${v.destino}</td>
          <td class="truncate-cell" title="${v.carga_descripcion} (${v.peso_kg.toLocaleString()} kg)">${v.carga_descripcion} (${v.peso_kg.toLocaleString()} kg)</td>
          <td>
            <button class="btn-secondary btn-with-icon btn-finalizar" style="padding: 4px 8px; font-size: 11px;">
              ${icons.flag}
              Asentar Llegada
            </button>
          </td>
        `;

        tr.querySelector('.btn-finalizar').addEventListener('click', () => abrirModalFinalizarViaje(v));
        tbody.appendChild(tr);
      });
    });
  } catch (err) {
    tbodies.forEach(tbody => {
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--red-danger);">Error al cargar viajes: ${err.message}</td></tr>`;
    });
  }
}

function abrirModalFinalizarViaje(v) {
  const idInput = document.getElementById('fin-viaje-id');
  const kmInput = document.getElementById('fin-viaje-km');
  const title = document.getElementById('modal-fin-viaje-title');
  const msg = document.getElementById('msg-fin-viaje');

  const salida = typeof v.km_salida === 'number' ? v.km_salida : 0;
  if (idInput) idInput.value = v._id;
  if (kmInput) kmInput.value = salida + 100;
  if (title) title.textContent = `Asentar Llegada: ${v.camion_patente} (Salida: ${salida} km)`;
  if (msg) {
    msg.textContent = '';
    msg.className = 'error-box';
  }

  openModal('modal-finalizar-viaje');
}
