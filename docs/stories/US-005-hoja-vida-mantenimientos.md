# US-005: Hoja de Vida y Órdenes de Mantenimiento Técnico

**Como** Jefe de Taller y Mantenimiento Mecánico  
**Quiero** asentar intervenciones técnicas atómicas en la hoja de vida del camión  
**Para** preservar el historial de servicios sin sobreescribir la información del vehículo.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Asentamiento Atómico en Array Embebido ($push)
- **Given** un camión registrado en la flota
- **When** se envía `POST /api/camiones/{patente}/mantenimientos` con `tipo`, `taller`, `costo`, `km_servicio`
- **Then** MongoDB utiliza `$push` para incorporar el servicio al arreglo `mantenimientos`
- **And** responde HTTP `200 OK`.

### Escenario 2: Asentamiento en Camión Inexistente
- **Given** una patente inexistente
- **When** se intenta enviar una orden de mantenimiento
- **Then** responde HTTP `404 Not Found`.

### Escenario 3: Rechazo de Mantenimiento Incompleto
- **Given** una orden que omite el taller o el costo
- **When** se envía `POST /api/camiones/{patente}/mantenimientos`
- **Then** responde HTTP `400 Bad Request` sin aplicar fallbacks silenciosos.
