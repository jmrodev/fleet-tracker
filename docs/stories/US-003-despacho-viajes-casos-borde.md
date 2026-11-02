# US-003: Despacho de Viajes y Casos de Indisponibilidad

**Como** Jefe de Despacho y Logística  
**Quiero** asignar camiones y choferes para realizar viajes de carga comercial  
**Para** transportar mercadería utilizando operaciones atómicas Compare-And-Swap (CAS) en MongoDB, evitando condiciones de carrera concurrentes.

---

## 🛠️ Especificación de Capacidades MongoDB en Juego
1. **Compare-And-Swap Atómico (`findOneAndUpdate`):**
   - La reserva de recursos no usa bloqueos pesados de tabla ni transacciones distribuidas lentas.
   - Utiliza la atomicidad a nivel de documento de WiredTiger:
     ```javascript
     db.collection('camiones').findOneAndUpdate(
       { patente: patenteUpper, estado: 'disponible', capacidad_kg: { $gte: pesoNum } },
       { $set: { estado: 'en_viaje' } },
       { returnDocument: 'after' }
     )
     ```
   - Si dos despachadores intentan asignar el mismo camión o chofer en el mismo milisegundo, uno triunfa y el otro recibe `null`, respondiendo HTTP 409 Conflict de inmediato.
2. **Rollback Compensatorio en Memoria de Motor:**
   - Si la reserva del camión triunfa pero la del chofer falla (o viceversa), el servicio dispara una mutación de compensación inmediata (`updateOne({ $set: { estado: 'disponible' } })`) garantizando consistencia eventual estricta.
3. **Índice Compuesto en Colección `viajes`:**
   - `{ camion_patente: 1 }` y `{ estado: 1 }` para localizar viajes activos y validar bloqueos sin escanear el histórico.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Despacho Exitoso con Reserva Atómica CAS
- **Given** un camión en estado `disponible` con `capacidad_kg >= peso`
- **And** un chofer en estado `disponible`
- **When** se envía `POST /api/viajes` con origen, destino, descripción de carga y peso
- **Then** MongoDB ejecuta `findOneAndUpdate` atómicamente transicionando el camión a `en_viaje`
- **And** ejecuta `findOneAndUpdate` transicionando el chofer a `asignado`
- **And** crea el documento del viaje con su `_id` BSON respondiendo HTTP `201 Created`.

### Escenario 2: Caso Borde - Ningún Camión Disponible (o Colisión Concurrente)
- **Given** un camión inexistente o cuyo estado ya es `en_viaje`
- **When** se envía `POST /api/viajes`
- **Then** el filtro `{ estado: 'disponible' }` no coincide
- **And** la API responde HTTP `404 Not Found` (si no existe) o HTTP `409 Conflict` (si ya fue tomado) sin tocar la nómina de choferes.

### Escenario 3: Caso Borde - Rollback Compensatorio si Chofer Falla
- **Given** un camión disponible pero un chofer no disponible
- **When** se envía `POST /api/viajes`
- **Then** el camión se reserva inicialmente pero la reserva del chofer falla
- **And** el sistema revierte automáticamente la reserva del camión a `disponible`
- **And** responde HTTP `409 Conflict` preservando la integridad del inventario.

### Escenario 4: Caso Borde - Invariante de Capacidad en Filtro Motor
- **Given** un camión con capacidad de carga de 20,000 kg
- **When** se intenta despachar con un peso de 25,000 kg
- **Then** la condición `capacidad_kg: { $gte: pesoNum }` o la validación previa rechaza la petición
- **And** responde HTTP `400 Bad Request` sin mutar ningún recurso en la base.
