# US-002: Alta, Consulta y Ciclo de Vida del Chofer

**Como** Responsable de Recursos Humanos y Logística  
**Quiero** registrar a los choferes habilitados con su DNI y datos de licencia de conducir  
**Para** asegurar que solo personal legalmente habilitado pueda ser asignado a la operación vial.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Alta Exitosa de Chofer
- **Given** un DNI no registrado previamente
- **When** se envía `POST /api/choferes` con `dni`, `nombre`, `telefono`, `licencia.categoria`, `licencia.vencimiento`
- **Then** responde HTTP `201 Created`
- **And** persiste el documento en `choferes` con `estado: "disponible"`.

### Escenario 2: Rechazo por DNI Duplicado
- **Given** un chofer ya dado de alta con DNI `30111222`
- **When** se envía otro `POST /api/choferes` con ese mismo DNI
- **Then** responde HTTP `409 Conflict`.

### Escenario 3: Rechazo si Faltan Datos de Licencia
- **Given** una petición sin categoría o vencimiento de licencia
- **When** se envía `POST /api/choferes`
- **Then** responde HTTP `400 Bad Request` sin asumir ninguna categoría mágica por defecto.

### Escenario 4: Consulta de Chofer Inexistente
- **Given** un DNI que no existe en el sistema
- **When** se consulta `GET /api/choferes/00000000`
- **Then** responde HTTP `404 Not Found`.

### Escenario 5: Protección de Eliminación si está Asignado
- **Given** un chofer que tiene un viaje activo (`estado: "asignado"`)
- **When** se envía `DELETE /api/choferes/{dni}`
- **Then** responde HTTP `400 Bad Request` impidiendo su eliminación.
