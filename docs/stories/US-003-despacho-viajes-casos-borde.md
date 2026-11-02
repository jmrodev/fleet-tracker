# US-003: Despacho de Viajes y Casos de Indisponibilidad

**Como** Jefe de Despacho y Logística  
**Quiero** asignar camiones y choferes para realizar viajes de carga comercial  
**Para** transportar mercadería garantizando que los recursos asignados estén disponibles y aptos.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Despacho Exitoso con Recursos Disponibles
- **Given** un camión en estado `disponible` con capacidad suficiente
- **And** un chofer en estado `disponible`
- **When** se envía `POST /api/viajes` con origen, destino, descripción de carga y peso
- **Then** responde HTTP `201 Created`
- **And** crea el viaje en estado `en_curso`
- **And** transiciona atómicamente el camión a `en_viaje` y el chofer a `asignado`.

### Escenario 2: Caso Borde - Ningún Camión Disponible (o Camión No Existe)
- **Given** una orden de despacho con una patente inexistente o no disponible
- **When** se envía `POST /api/viajes` indicando dicha patente
- **Then** responde HTTP `404 Not Found` (si no existe) o HTTP `409 Conflict` (si ya está `en_viaje` o `en_mantenimiento`)
- **And** la operación es rechazada sin modificar el estado del chofer.

### Escenario 3: Caso Borde - Ningún Chofer Disponible (o Chofer No Existe)
- **Given** una orden de despacho con un chofer inexistente o ya asignado a otro viaje
- **When** se envía `POST /api/viajes`
- **Then** responde HTTP `404 Not Found` (si no existe) o HTTP `409 Conflict` (si no está disponible)
- **And** el camión queda intacto en estado `disponible` (rollback automático de reserva).

### Escenario 4: Caso Borde - Sobrecarga de Peso
- **Given** un camión con capacidad de carga de 20,000 kg
- **When** se intenta despachar con un peso de 25,000 kg
- **Then** la API responde HTTP `400 Bad Request` indicando que supera la capacidad técnica
- **And** ni el camión ni el chofer modifican su estado.
