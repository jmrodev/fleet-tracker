# US-004: Analítica Ejecutiva y Agregación de Costos de Flota

**Como** Director de Operaciones Logísticas  
**Quiero** visualizar indicadores clave de rendimiento (KPIs) y analítica de costos agregados por marca de vehículo  
**Para** tomar decisiones de inversión en renovación de flota basadas en costos reales de mantenimiento por kilómetro.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Pipeline de Agregación de Costos por Marca ($unwind + $group)
- **Given** una flota con múltiples camiones y servicios mecánicos registrados
- **When** se solicita `GET /api/stats/flota`
- **Then** el motor MongoDB ejecuta un pipeline de agregación desenrollando (`$unwind`) el array de mantenimientos
- **And** agrupa por `marca` (`$group: { _id: "$marca" }`) sumando el costo total y calculando el promedio por intervención
- **And** ordena las marcas de mayor a menor gasto acumulado.

### Escenario 2: Cómputo Centralizado de Odometría Total de Flota
- **Given** viajes finalizados exitosamente en la colección `viajes`
- **When** se consulta `GET /api/stats/flota`
- **Then** el sistema calcula la sumatoria de `km_recorridos` de todos los viajes cerrados
- **And** expone la métrica `km_flota_recorridos` sin valores indefinidos o nulos.

### Escenario 3: Conteo Seguro de Estados de Flota
- **Given** camiones distribuidos en estados `disponible`, `en_viaje` y `en_mantenimiento`
- **When** se consulta `GET /api/stats/flota`
- **Then** el sistema retorna el recuento exacto en tiempo real (`total_camiones`, `total_en_viaje`, `total_mantenimiento`, `viajes_finalizados`).
