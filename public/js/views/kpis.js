// public/js/views/kpis.js - Vista de Indicadores Clave
import { api } from '../api.js';

export async function renderKPIs() {
  try {
    const data = await api.getStats();

    const elCamiones = document.getElementById('kpi-camiones');
    const elViaje = document.getElementById('kpi-viaje');
    const elKm = document.getElementById('kpi-km');
    const elViajesFin = document.getElementById('kpi-viajes-fin');

    if (elCamiones) elCamiones.textContent = data.total_camiones ?? 0;
    if (elViaje) elViaje.textContent = data.total_en_viaje ?? 0;
    if (elKm) elKm.textContent = `${(data.km_flota_recorridos || 0).toLocaleString()} km`;
    if (elViajesFin) elViajesFin.textContent = data.viajes_finalizados ?? 0;
  } catch (err) {
    console.error('Error cargando KPIs:', err);
  }
}
