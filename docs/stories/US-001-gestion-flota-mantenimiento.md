# US-001: Gestión de Flota, Seguimiento de Viajes y Mantenimiento

**Como** Jefe de Operaciones Logísticas  
**Quiero** gestionar el ciclo de vida de los camiones, sus choferes, viajes de carga y registro de servicios técnicos  
**Para** garantizar la disponibilidad de las unidades, evitar sobrecargas y auditar los costos de mantenimiento en MongoDB.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Registro de Camión con Patente Única
- **Given** que se dispone de una patente no registrada previamente en el sistema (ej. `AE123CD`)
- **When** se envía un `POST /api/camiones` con los datos técnicos (marca, modelo, año, capacidad máxima en kg y odómetro inicial)
- **Then** el sistema responde con HTTP `201 Created`
- **And** persiste el documento en la colección `camiones` con un índice único garantizado a nivel de motor MongoDB
- **And** si se intenta registrar nuevamente la misma patente, responde con HTTP `409 Conflict`.

### Escenario 2: Despacho y Validación de Capacidad en Viajes
- **Given** un camión con capacidad de carga definida y estado `disponible`
- **And** un chofer con licencia vigente y estado `disponible`
- **When** se solicita iniciar un viaje mediante `POST /api/viajes`
- **Then** el sistema verifica que el peso declarado no exceda la capacidad del vehículo
- **And** si la validación pasa, crea el viaje en estado `en_curso` y actualiza atómicamente el estado del camión a `en_viaje` y del chofer a `asignado`.

### Escenario 3: Finalización de Viaje y Cómputo de Odometría
- **Given** un viaje en estado `en_curso`
- **When** se realiza un `PUT /api/viajes/{id}/finalizar` indicando el odómetro de llegada
- **Then** el sistema valida que el kilometraje de llegada sea mayor o igual al de salida
- **And** calcula los kilómetros recorridos reales
- **And** actualiza el estado a `finalizado`, liberando al camión (`disponible`) con su nuevo odómetro y al chofer (`disponible`).

### Escenario 4: Registro Atómico de Mantenimiento Preventivo
- **Given** un camión registrado en la flota
- **When** se envía una orden de servicio mediante `POST /api/camiones/{patente}/mantenimientos`
- **Then** el sistema utiliza el operador nativo `$push` de MongoDB para incorporar el registro al array embebido `mantenimientos` sin sobreescribir la información previa de la unidad
- **And** responde con HTTP `200 OK`.

### Escenario 5: Métricas de Costos vía Aggregation Pipeline
- **Given** unidades de diferentes marcas con mantenimientos asentados en sus historiales
- **When** se consulta `GET /api/stats/flota`
- **Then** el motor MongoDB ejecuta un Aggregation Pipeline desenrollando los subdocumentos (`$unwind: "$mantenimientos"`)
- **And** agrupa por marca (`$group`) computando el gasto acumulado (`$sum`) y el costo promedio por intervención (`$avg`).
