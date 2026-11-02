# US-003: Auditoría y Hoja de Vida de Mantenimientos Preventivos

**Como** Jefe de Taller y Mantenimiento Mecánico  
**Quiero** asentar intervenciones técnicas detalladas en los camiones y consultar su hoja de vida acumulada  
**Para** garantizar la seguridad activa de los vehículos sin alterar su estado operativo general a menos que sea explícito.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Asentamiento Atómico en Subdocumento Embebido
- **Given** un camión registrado en la flota con odómetro actual
- **When** se envía `POST /api/camiones/{patente}/mantenimientos` especificando `tipo`, `taller`, `costo` y `km_servicio`
- **Then** el sistema incorpora el registro al array embebido `mantenimientos` usando el operador atómico `$push` de MongoDB
- **And** responde con HTTP `200 OK`
- **And** mantiene inalterada la información técnica previa del vehículo.

### Escenario 2: Rechazo Estricto si Faltan Campos de Servicio
- **Given** una orden de mantenimiento que omite el taller o el costo
- **When** se envía `POST /api/camiones/{patente}/mantenimientos` sin `taller` o sin `costo`
- **Then** el sistema rechaza la petición con HTTP `400 Bad Request`
- **And** no asume ningún valor mágico por defecto (como 'Taller Interno' o costo cero).

### Escenario 3: Cambio de Estado Opcional y Validado
- **Given** una unidad en estado `disponible` que ingresa a reparación mayor
- **When** se envía `POST /api/camiones/{patente}/mantenimientos` incluyendo el parámetro `cambiar_estado: "en_mantenimiento"`
- **Then** el sistema asienta el mantenimiento y actualiza el estado de la unidad a `en_mantenimiento`
- **And** si se envía un estado inválido (ej: `roto`), rechaza la solicitud con HTTP `400 Bad Request`.

### Escenario 4: Consulta de Hoja de Vida Completa
- **Given** un camión con múltiples intervenciones mecánicas acumuladas en el tiempo
- **When** se consulta `GET /api/camiones/{patente}`
- **Then** el documento devuelto contiene el array íntegro de `mantenimientos` ordenado históricamente para su desglose en el frontend.
