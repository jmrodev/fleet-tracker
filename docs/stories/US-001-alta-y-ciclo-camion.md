# US-001: Alta, Consulta y Ciclo de Vida del Camión

**Como** Jefe de Mantenimiento y Flota  
**Quiero** registrar vehículos de carga con patente y especificaciones técnicas, y consultar su estado  
**Para** mantener el inventario activo de unidades aptas para transporte comercial.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Registro Exitoso de Primer Camión
- **Given** una patente válida no existente (ej. `AE123CD`)
- **When** se envía `POST /api/camiones` con `marca`, `modelo`, `anio`, `capacidad_kg`, `kilometraje_actual`
- **Then** responde HTTP `201 Created`
- **And** persiste el camión con `estado: "disponible"` y un arreglo embebido `mantenimientos: []` vacío.

### Escenario 2: Rechazo por Patente Duplicada (Índice Único)
- **Given** un camión ya registrado con patente `AE123CD`
- **When** se intenta enviar nuevamente un `POST /api/camiones` con la misma patente
- **Then** el motor MongoDB rechaza la inserción
- **And** la API responde con HTTP `409 Conflict`.

### Escenario 3: Rechazo por Datos Incompletos
- **Given** una petición sin `patente` o sin `capacidad_kg`
- **When** se envía `POST /api/camiones`
- **Then** responde HTTP `400 Bad Request` indicando los campos obligatorios.

### Escenario 4: Consulta de Camión Inexistente
- **Given** una patente que nunca fue registrada (ej. `ZZ999ZZ`)
- **When** se consulta `GET /api/camiones/ZZ999ZZ`
- **Then** responde HTTP `404 Not Found`.

### Escenario 5: Protección de Eliminación en Viaje Activo
- **Given** un camión en estado `en_viaje`
- **When** se envía `DELETE /api/camiones/{patente}`
- **Then** el sistema rechaza la eliminación con HTTP `400 Bad Request`.
