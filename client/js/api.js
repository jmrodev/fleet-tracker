// client/js/api.js - Cliente HTTP desacoplado
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
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al obtener camión`;
      throw new Error(msg);
    }
    return data;
  },

  async crearCamion(payload) {
    const res = await fetch('/api/camiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al registrar camión`;
      throw new Error(msg);
    }
    return data;
  },

  async actualizarCamion(patente, payload) {
    const res = await fetch(`/api/camiones/${encodeURIComponent(patente)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al actualizar camión`;
      throw new Error(msg);
    }
    return data;
  },

  async eliminarCamion(patente) {
    const res = await fetch(`/api/camiones/${encodeURIComponent(patente)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al eliminar camión`;
      throw new Error(msg);
    }
    return data;
  },

  async registrarMantenimiento(patente, payload) {
    const res = await fetch(`/api/camiones/${encodeURIComponent(patente)}/mantenimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al asentar mantenimiento`;
      throw new Error(msg);
    }
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
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al obtener chofer`;
      throw new Error(msg);
    }
    return data;
  },

  async crearChofer(payload) {
    const res = await fetch('/api/choferes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al registrar chofer`;
      throw new Error(msg);
    }
    return data;
  },

  async actualizarChofer(dni, payload) {
    const res = await fetch(`/api/choferes/${encodeURIComponent(dni)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al actualizar chofer`;
      throw new Error(msg);
    }
    return data;
  },

  async eliminarChofer(dni) {
    const res = await fetch(`/api/choferes/${encodeURIComponent(dni)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al eliminar chofer`;
      throw new Error(msg);
    }
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
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al despachar viaje`;
      throw new Error(msg);
    }
    return data;
  },

  async finalizarViaje(id, payload) {
    const res = await fetch(`/api/viajes/${encodeURIComponent(id)}/finalizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status}: Error al finalizar viaje`;
      throw new Error(msg);
    }
    return data;
  },

  // --- ESTADÍSTICAS ---
  async getStats() {
    const res = await fetch('/api/stats/flota');
    return res.json();
  }
};
