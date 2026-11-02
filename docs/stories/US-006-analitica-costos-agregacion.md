# US-006: Analítica de Costos y Agregación de Flota

**Como** Director de Operaciones Logísticas  
**Quiero** consultar los indicadores acumulados de la flota y el gasto de mantenimiento desglosado por marca  
**Para** evaluar la rentabilidad del transporte y planificar la compra de repuestos.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Pipeline de Agregación de Costos por Marca ($unwind + $group)
- **Given** camiones de diferentes marcas con mantenimientos asentados
- **When** se consulta `GET /api/stats/flota`
- **Then** MongoDB ejecuta un pipeline que desenrolla `mantenimientos` (`$unwind`)
- **And** agrupa por `marca` (`$group`) sumando el gasto total y calculando el promedio por servicio.

### Escenario 2: Acumulación de Kilómetros de Flota
- **Given** viajes finalizados en la base de datos
- **When** se consulta `GET /api/stats/flota`
- **Then** el sistema totaliza los kilómetros reales recorridos exponiendo `km_flota_recorridos`.
