# US-004: Finalización de Viajes y Cómputo de Odometría

**Como** Supervisor de Recepción y Control de Flota  
**Quiero** asentar la llegada de un viaje con el odómetro final del vehículo  
**Para** computar los kilómetros recorridos reales, actualizar el odómetro del camión y liberar los recursos.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Llegada Exitosa y Liberación de Recursos
- **Given** un viaje en estado `en_curso` con odómetro de salida 100,000 km
- **When** se envía `PUT /api/viajes/{id}/finalizar` con `km_llegada: 101200`
- **Then** responde HTTP `200 OK`
- **And** computa `km_recorridos: 1200` y transiciona el viaje a `finalizado`
- **And** actualiza el camión con `kilometraje_actual: 101200` y estado `disponible`
- **And** libera al chofer con estado `disponible`.

### Escenario 2: Rechazo por Retroceso Fraudulento de Odómetro
- **Given** un viaje con odómetro de salida 100,000 km
- **When** se envía `PUT /api/viajes/{id}/finalizar` con `km_llegada: 98000` (menor a la salida)
- **Then** responde HTTP `400 Bad Request`
- **And** no altera el viaje ni los estados de los recursos.

### Escenario 3: Finalización de Viaje Inexistente
- **Given** un identificador de viaje que no existe en MongoDB
- **When** se envía `PUT /api/viajes/000000000000000000000000/finalizar`
- **Then** responde HTTP `404 Not Found`.
