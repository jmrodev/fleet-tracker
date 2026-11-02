# US-002: Gestión Integral de Choferes y Licencias Habilitantes

**Como** Coordinador de Logística y Recursos Humanos  
**Quiero** gestionar el registro, actualización y auditoría de los choferes de la flota con validación de DNI y licencia  
**Para** asegurar que solo personal legalmente habilitado sea asignado a viajes comerciales y evitar multas o sanciones viales.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Registro de Chofer con DNI Único y Contrato Estricto
- **Given** que un chofer nuevo debe ser incorporado a la nómina
- **When** se envía una petición `POST /api/choferes` con todos los campos requeridos (`dni`, `nombre`, `telefono`, `licencia.categoria`, `licencia.vencimiento`)
- **Then** el sistema responde con HTTP `201 Created`
- **And** persiste al chofer en la colección `choferes` con estado inicial `disponible`
- **And** si se intenta registrar otro chofer con el mismo `dni`, el motor responde con HTTP `409 Conflict`.

### Escenario 2: Rechazo de Contrato Incompleto sin Fallbacks Mágicos
- **Given** una solicitud de registro de chofer sin categoría de licencia o sin fecha de vencimiento
- **When** se envía `POST /api/choferes` omitiendo `licencia.categoria` o `licencia.vencimiento`
- **Then** el sistema rechaza la petición con HTTP `400 Bad Request`
- **And** devuelve un mensaje de error explícito indicando que dichos campos son obligatorios
- **And** bajo ninguna circunstancia asume una categoría predeterminada (como 'E1').

### Escenario 3: Filtro Seguro de Choferes por Estado y Paginación Defensiva
- **Given** choferes registrados en estados `disponible` y `asignado`
- **When** se consulta `GET /api/choferes?estado={estado}`
- **Then** si `{estado}` pertenece a `['disponible', 'asignado']`, el sistema filtra exactamente los choferes coincidentes
- **And** si `{estado}` es inválido (ej: `inactivo`), responde con HTTP `400 Bad Request` indicando los permitidos
- **And** valida que los parámetros `limit` y `skip` sean enteros positivos o 0.

### Escenario 4: Actualización Controlada de Datos de Contacto y Licencia
- **Given** un chofer existente en el sistema
- **When** se envía `PUT /api/choferes/{dni}` con teléfono actualizado o renovación de licencia
- **Then** el sistema actualiza únicamente los campos provistos
- **And** si el chofer no existe, responde con HTTP `404 Not Found`.

### Escenario 5: Eliminación Segura Protegida contra Choferes Asignados
- **Given** un chofer registrado en la base de datos
- **When** se envía `DELETE /api/choferes/{dni}`
- **Then** si el chofer se encuentra en estado `asignado`, el sistema rechaza la eliminación con HTTP `400 Bad Request`
- **And** si está `disponible`, elimina el documento y responde con HTTP `200 OK`.
