// public/js/api.js - Cliente HTTP desacoplado
export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },

  // --- CAMIONES CRUD ---
  async getCamiones(estado) {
    const url = estado ? `/api/camiones?estado=${encodeURIComponent(estado)}` : '/api/camiones';
    const res = await fetch(url);
    return res.json();
  },

  async getCamion(patente) {
    const res = await fetch(`/api/camiones/${encodeURIComponent(patente)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener camión');
    return data;
  },

  async crearCamion(payload) {
    const res = await fetch('/api/camiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar camión');
    return data;
  },

  async actualizarCamion(patente, payload) {
    const res = await fetch(`/api/camiones/${encodeURIComponent(patente)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar camión');
    return data;
  },

  async eliminarCamion(patente) {
    const res = await fetch(`/api/camiones/${encodeURIComponent(patente)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar camión');
    return data;
  },

  async registrarMantenimiento(patente, payload) {
    const res = await fetch(`/api/camiones/${encodeURIComponent(patente)}/mantenimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al asentar mantenimiento');
    return data;
  },

  // --- CHOFERES CRUD ---
  async getChoferes(estado) {
    const url = estado ? `/api/choferes?estado=${encodeURIComponent(estado)}` : '/api/choferes';
    const res = await fetch(url);
    return res.json();
  },

  async getChofer(dni) {
    const res = await fetch(`/api/choferes/${encodeURIComponent(dni)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener chofer');
    return data;
  },

  async crearChofer(payload) {
    const res = await fetch('/api/choferes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar chofer');
    return data;
  },

  async actualizarChofer(dni, payload) {
    const res = await fetch(`/api/choferes/${encodeURIComponent(dni)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar chofer');
    return data;
  },

  async eliminarChofer(dni) {
    const res = await fetch(`/api/choferes/${encodeURIComponent(dni)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar chofer');
    return data;
  },

  // --- VIAJES ---
  async getViajes(estado) {
    const url = estado ? `/api/viajes?estado=${encodeURIComponent(estado)}` : '/api/viajes';
    const res = await fetch(url);
    return res.json();
  },

  async despacharViaje(payload) {
    const res = await fetch('/api/viajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al despachar viaje');
    return data;
  },

  async finalizarViaje(id, payload) {
    const res = await fetch(`/api/viajes/${encodeURIComponent(id)}/finalizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al finalizar viaje');
    return data;
  },

  // --- ESTADÍSTICAS ---
  async getStats() {
    const res = await fetch('/api/stats/flota');
    return res.json();
  }
};
