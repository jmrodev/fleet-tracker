// public/js/views/viajes.js - Vista de Despacho y Seguimiento de Viajes (Harden)
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';

export async function initViajesView() {
  const formViaje = document.getElementById('form-viaje');
  if (formViaje && !formViaje.dataset.bound) {
    formViaje.dataset.bound = 'true';
    formViaje.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = formViaje.querySelector('button[type="submit"]');
      const msg = document.getElementById('msg-viaje');
      msg.textContent = '';
      msg.className = 'error-box';

      // Harden: Prevención de doble despacho concurrente
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Despachando unidad...';
      }

      try {
        const payload = {
          camion_patente: document.getElementById('viaje-camion').value,
          chofer_dni: document.getElementById('viaje-chofer').value,
          origen: document.getElementById('viaje-origen').value,
          destino: document.getElementById('viaje-destino').value,
          carga_descripcion: document.getElementById('viaje-carga').value,
          peso_kg: Number(document.getElementById('viaje-peso').value)
        };

        await api.despacharViaje(payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Viaje despachado y registrado atómicamente.';
        await renderViajes();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Iniciar Despacho';
        }
      }
    });
  }

  await renderViajes();
}

export async function renderViajes() {
  await Promise.all([actualizarSelectores(), renderTablaViajes()]);
}

async function actualizarSelectores() {
  const [camiones, choferes] = await Promise.all([
    api.getCamiones('disponible'),
    api.getChoferes('disponible')
  ]);

  const selCamion = document.getElementById('viaje-camion');
  const selChofer = document.getElementById('viaje-chofer');

  if (selCamion) {
    selCamion.innerHTML = '<option value="">Seleccione camión disponible...</option>';
    if (camiones.length === 0) {
      selCamion.innerHTML = '<option value="">⚠️ No hay camiones disponibles en este momento</option>';
    } else {
      camiones.forEach(c => {
        selCamion.innerHTML += `<option value="${c.patente}">${c.patente} - ${c.marca} ${c.modelo} (Máx: ${c.capacidad_kg.toLocaleString()} kg)</option>`;
      });
    }
  }

  if (selChofer) {
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
  const tbody = document.getElementById('viajes-body');
  if (!tbody) return;

  try {
    const viajes = await api.getViajes('en_curso');
    tbody.innerHTML = '';

    if (viajes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <div class="empty-state-icon">🛣️</div>
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
          <button class="btn-secondary btn-finalizar" style="padding: 4px 8px; font-size: 11px;">🏁 Asentar Llegada</button>
        </td>
      `;

      tr.querySelector('.btn-finalizar').addEventListener('click', () => finalizarViaje(v));
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--red-danger);">Error al cargar viajes: ${err.message}</td></tr>`;
  }
}

async function finalizarViaje(viaje) {
  const kmEstimado = (viaje.km_salida || 0) + 100;
  const kmLlegada = prompt(`Asentar kilometraje final para viaje de ${viaje.camion_patente} (Km salida: ${viaje.km_salida || 0}):`, kmEstimado);
  if (kmLlegada === null) return;

  const obs = prompt('Observaciones de recepción (opcional):', 'Entrega en conformidad.');

  try {
    await api.finalizarViaje(viaje._id, {
      km_llegada: Number(kmLlegada),
      observaciones: obs ? obs.trim() : ''
    });
    await renderViajes();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}
