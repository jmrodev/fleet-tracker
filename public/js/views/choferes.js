// public/js/views/choferes.js - Vista dedicada e independiente de Choferes (Harden + Filtros + Modal Edición)
import { api } from '../api.js';
import { renderKPIs } from './kpis.js';
import { openModal, closeModal, showToast, confirmAction } from '../app.js';
import { icons } from '../icons.js';

let choferesCache = [];

export async function initChoferesView() {
  bindFormNuevoChofer();
  bindFormEditarChofer();
  bindFiltrosChoferes();
  await renderChoferes();
}

function bindFiltrosChoferes() {
  const searchInput = document.getElementById('filtro-choferes');
  const estadoSelect = document.getElementById('filtro-estado-choferes');

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
  const search = (document.getElementById('filtro-choferes')?.value || '').toLowerCase().trim();
  const estado = (document.getElementById('filtro-estado-choferes')?.value || '').trim();

  const filtrados = choferesCache.filter(ch => {
    const matchSearch = !search || 
      ch.dni.toLowerCase().includes(search) || 
      ch.nombre.toLowerCase().includes(search) || 
      ch.telefono.toLowerCase().includes(search);
    const matchEstado = !estado || ch.estado === estado;
    return matchSearch && matchEstado;
  });

  renderTablaChoferes(filtrados);
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
          dni: document.getElementById('chofer-dni').value.trim(),
          nombre: document.getElementById('chofer-nombre').value.trim(),
          telefono: document.getElementById('chofer-tel').value.trim(),
          licencia: {
            categoria: document.getElementById('chofer-lic-cat').value.trim(),
            vencimiento: document.getElementById('chofer-lic-venc').value
          },
          foto_url: document.getElementById('chofer-foto').value.trim()
        };

        await api.crearChofer(payload);
        e.target.reset();
        msg.className = 'success-box';
        msg.textContent = '✓ Chofer dado de alta con éxito (Índice único verificado en motor).';
        showToast(`Chofer ${payload.nombre} registrado con éxito.`);
        setTimeout(() => {
          closeModal('modal-chofer');
        }, 800);
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

function bindFormEditarChofer() {
  const formEdit = document.getElementById('form-editar-chofer');
  if (formEdit && !formEdit.dataset.bound) {
    formEdit.dataset.bound = 'true';
    formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dni = document.getElementById('edit-chofer-dni').value;
      const nuevoTel = document.getElementById('edit-chofer-tel').value.trim();
      const nuevoEstado = document.getElementById('edit-chofer-estado').value;

      try {
        await api.actualizarChofer(dni, {
          telefono: nuevoTel,
          estado: nuevoEstado
        });
        showToast(`Chofer DNI ${dni} actualizado.`);
        closeModal('modal-editar-chofer');
        await renderChoferes();
        await renderKPIs();
      } catch (err) {
        const msg = document.getElementById('msg-edit-chofer');
        if (msg) msg.textContent = err.message;
      }
    });
  }
}

export async function renderChoferes() {
  const tbody = document.getElementById('choferes-body');
  if (tbody && !choferesCache.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="padding: 24px;">
          <div class="skeleton-line" style="width: 100%;"></div>
          <div class="skeleton-line" style="width: 85%;"></div>
        </td>
      </tr>
    `;
  }

  choferesCache = await api.getChoferes();
  aplicarFiltros();
}

function renderTablaChoferes(choferes) {
  const tbody = document.getElementById('choferes-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!choferes.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon" style="color:var(--text-muted);">${icons.user}</div>
          <div class="empty-state-text">No se encontraron choferes registrados o coincidentes con los filtros aplicados.</div>
        </td>
      </tr>
    `;
    return;
  }

  choferes.forEach(ch => {
    const fotoImg = ch.foto_url 
      ? `<img src="${ch.foto_url}" class="driver-thumb" alt="${ch.nombre}" loading="lazy">`
      : `<div class="driver-thumb" style="display:flex; align-items:center; justify-content:center; color:var(--text-muted);">${icons.user}</div>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width: 50px;">${fotoImg}</td>
      <td><strong style="font-family: var(--font-mono);">${ch.dni}</strong></td>
      <td>${ch.nombre}</td>
      <td>${ch.telefono}</td>
      <td><span style="font-family: var(--font-mono);">Licencia ${ch.licencia.categoria}</span> (Vence: ${ch.licencia.vencimiento})</td>
      <td><span class="badge-${ch.estado}">${ch.estado}</span></td>
      <td style="white-space: nowrap;">
        <button class="btn-secondary btn-with-icon btn-edit-chofer" style="padding: 4px 8px; font-size: 11px;">
          ${icons.edit}
          Editar
        </button>
        <button class="btn-danger btn-with-icon btn-del-chofer" style="padding: 4px 8px; font-size: 11px;">
          ${icons.trash}
          Eliminar
        </button>
      </td>
    `;

    tr.querySelector('.btn-edit-chofer').addEventListener('click', () => abrirModalEdicionChofer(ch));
    tr.querySelector('.btn-del-chofer').addEventListener('click', () => borrarChofer(ch.dni));
    tbody.appendChild(tr);
  });
}

function abrirModalEdicionChofer(ch) {
  const dniInput = document.getElementById('edit-chofer-dni');
  const telInput = document.getElementById('edit-chofer-tel');
  const estadoSelect = document.getElementById('edit-chofer-estado');
  const title = document.getElementById('modal-edit-chofer-title');
  const msg = document.getElementById('msg-edit-chofer');

  if (dniInput) dniInput.value = ch.dni;
  if (telInput) telInput.value = ch.telefono;
  if (estadoSelect) estadoSelect.value = ch.estado;
  if (title) title.textContent = `Actualizar Chofer: ${ch.nombre}`;
  if (msg) {
    msg.textContent = '';
    msg.className = 'error-box';
  }

  openModal('modal-editar-chofer');
}

function borrarChofer(dni) {
  confirmAction({
    title: `Dar de Baja Chofer DNI ${dni}`,
    message: `¿Está seguro de desvincular al chofer con DNI ${dni} de la nómina activa?`,
    confirmText: 'Dar de Baja',
    onConfirm: async () => {
      try {
        await api.eliminarChofer(dni);
        showToast(`Chofer DNI ${dni} dado de baja.`);
        await renderChoferes();
        await renderKPIs();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });
}
