# US-005: Concurrencia Atómica, Invariantes de Odómetro y Resiliencia

**Como** Arquitecto de Software y Administrador de Sistemas  
**Quiero** que la base de datos MongoDB garantice atomicidad CAS, invariantes físicos en odómetros y healthchecks activos  
**Para** eliminar condiciones de carrera concurrentes, evitar retrocesos fraudulentos de kilometraje y detectar fallas de conectividad inmediatamente.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Reserva Atómica Concurrente (Compare-and-Swap CAS)
- **Given** un camión en estado `disponible` y dos solicitudes de viaje concurrentes para la misma unidad
- **When** se ejecutan en paralelo las reservas con `findOneAndUpdate({ patente, estado: 'disponible' }, { $set: { estado: 'en_viaje' } })`
- **Then** exactamente una solicitud tiene éxito y reserva la unidad
- **And** la segunda solicitud es rechazada atómicamente con HTTP `409 Conflict`, sin generar duplicación de viaje.

### Escenario 2: Invariante Monótono de Odometría con Operador $max
- **Given** un viaje que finaliza con kilometraje de llegada menor al odómetro registrado en el camión
- **When** se procesa la actualización de la unidad
- **Then** la base de datos aplica el operador atómico `$max: { kilometraje_actual: km_llegada }` garantizando que el odómetro jamás retroceda
- **And** si el kilometraje de llegada es menor al de salida del propio viaje, rechaza la petición con HTTP `400 Bad Request`.

### Escenario 3: Verificación de Capacidad de Carga en Despacho
- **Given** un camión con capacidad máxima declarada de 15,000 kg
- **When** se intenta despachar un viaje mediante `POST /api/viajes` con una carga de 16,000 kg
- **Then** el sistema rechaza la operación con HTTP `400 Bad Request` indicando que excede la capacidad
- **And** el estado del camión permanece inalterado en `disponible`.

### Escenario 4: Healthcheck Activo con Ping Directo al Motor
- **Given** el servicio backend conectado al clúster de MongoDB
- **When** se solicita `GET /api/health`
- **Then** el servidor ejecuta `db.command({ ping: 1 })` y responde HTTP `200 OK` con `database: "connected"` y `latency_ms` real
- **And** si la base de datos está desconectada, responde inmediatamente con HTTP `503 Service Unavailable`.
