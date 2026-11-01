// public/js/views/choferes.js - Vista dedicada e independiente de Choferes (Harden)
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';

export async function initChoferesView() {
  bindFormNuevoChofer();
  await renderChoferes();
}

function bindFormNuevoChofer() {
  const form = document.getElementById('form-chofer');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const msg = document.getElementById('msg-chofer');
      msg.textContent = '';
      msg.className = 'error-box';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando Chofer...';
      }

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
        msg.textContent = '✓ Chofer dado de alta con éxito (Índice único verificado en motor).';
        await renderChoferes();
        await renderKPIs();
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar Chofer';
        }
      }
    });
  }
}

export async function renderChoferes() {
  const choferes = await api.getChoferes();
  renderTablaChoferes(choferes);
}

function renderTablaChoferes(choferes) {
  const tbody = document.getElementById('choferes-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!choferes.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">👤</div>
          <div class="empty-state-text">No hay choferes registrados en la nómina. Complete el formulario para incorporar conductores.</div>
        </td>
      </tr>
    `;
    return;
  }

  choferes.forEach(ch => {
    const fotoImg = ch.foto_url 
      ? `<img src="${ch.foto_url}" class="driver-thumb" alt="${ch.nombre}" loading="lazy">`
      : `<div class="driver-thumb" style="display:flex; align-items:center; justify-content:center; font-size:1rem;">👤</div>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 50px;">${fotoImg}</td>
      <td><strong style="font-family: var(--font-mono);">${ch.dni}</strong></td>
      <td>${ch.nombre}</td>
      <td>${ch.telefono}</td>
      <td><span style="font-family: var(--font-mono);">Licencia ${ch.licencia.categoria}</span> (Vence: ${ch.licencia.vencimiento})</td>
      <td><span class="badge-${ch.estado}">${ch.estado}</span></td>
      <td style="white-space: nowrap;">
        <button class="btn-secondary btn-edit-chofer" style="padding: 4px 8px; font-size: 11px;">✏️ Editar</button>
        <button class="btn-danger btn-del-chofer" style="padding: 4px 8px; font-size: 11px;">🗑️ Eliminar</button>
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
    await renderChoferes();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}

async function borrarChofer(dni) {
  if (!confirm(`¿Está seguro de dar de baja al chofer con DNI ${dni}?`)) return;
  try {
    await api.eliminarChofer(dni);
    await renderChoferes();
    await renderKPIs();
  } catch (err) {
    alert(err.message);
  }
}
