// public/js/views/viajes.js - Vista de Despacho y Seguimiento de Viajes
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';

export async function initViajesView() {
  const formViaje = document.getElementById('form-viaje');
  if (formViaje && !formViaje.dataset.bound) {
    formViaje.dataset.bound = 'true';
    formViaje.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('msg-viaje');
      msg.textContent = '';
      msg.className = 'error-box';

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
        msg.textContent = '✓ Viaje despachado correctamente.';
        await renderViajes();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
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
    camiones.forEach(c => {
      selCamion.innerHTML += `<option value="${c.patente}">${c.patente} - ${c.marca} ${c.modelo} (Máx: ${c.capacidad_kg}kg)</option>`;
    });
  }

  if (selChofer) {
    selChofer.innerHTML = '<option value="">Seleccione chofer disponible...</option>';
    choferes.forEach(ch => {
      selChofer.innerHTML += `<option value="${ch.dni}">${ch.nombre} (DNI: ${ch.dni})</option>`;
    });
  }
}

async function renderTablaViajes() {
  const tbody = document.getElementById('viajes-body');
  if (!tbody) return;

  try {
    const viajes = await api.getViajes('en_curso');
    tbody.innerHTML = '';

    if (viajes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #8b949e;">No hay viajes en tránsito actualmente</td></tr>';
      return;
    }

    viajes.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${v.camion_patente}</strong></td>
        <td>${v.chofer_nombre}</td>
        <td>${v.origen} ➔ ${v.destino}</td>
        <td>${v.carga_descripcion} (${v.peso_kg.toLocaleString()} kg)</td>
        <td>
          <button class="btn-finish" data-id="${v._id}" data-km="${v.km_salida}">
            Registrar Llegada
          </button>
        </td>
      `;
      const btn = tr.querySelector('.btn-finish');
      btn.addEventListener('click', () => finalizarViaje(v._id, v.km_salida));
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: #f85149;">Error cargando viajes: ${err.message}</td></tr>`;
  }
}

async function finalizarViaje(id, kmSalida) {
  const km = prompt(`Ingrese odómetro de llegada (Salida registrada: ${kmSalida} km):`, kmSalida + 350);
  if (!km) return;

  try {
    await api.finalizarViaje(id, {
      km_llegada: Number(km),
      observaciones: 'Llegada a destino conforme'
    });
    await renderViajes();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}
