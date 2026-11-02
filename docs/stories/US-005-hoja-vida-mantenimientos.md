# US-005: Hoja de Vida y Mantenimientos Técnicos Embebidos ($push)

**Como** Encargado de Taller Mecánico  
**Quiero** registrar órdenes de servicio y gastos de mantenimiento dentro del perfil de cada unidad  
**Para** preservar la hoja de vida completa del vehículo mediante subdocumentos embebidos y el operador `$push` de MongoDB sin necesidad de tablas intermedias ni JOINs.

---

## 🛠️ Especificación de Capacidades MongoDB en Juego
1. **Modelado NoSQL por Embebido (*Embedding*):**
   - Una unidad de carga y su historial de reparaciones forman una unidad de acceso natural (1 a N acotado).
   - Al consultar un camión, se recupera toda su historia técnica en un solo *roundtrip* de red.
2. **Operador Atómico `$push`:**
   - La inserción de una nueva orden de servicio no requiere leer todo el array ni reescribir el documento completo:
     ```javascript
     db.collection('camiones').updateOne(
       { patente },
       {
         $push: { mantenimientos: registroMantenimiento },
         ...(nuevoEstado ? { $set: { estado: nuevoEstado } } : {})
       }
     )
     ```
   - Operación totalmente atómica e idempotente ante escrituras concurrentes.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Registro Atómico de Mantenimiento con `$push`
- **Given** un camión existente con patente `AE123CD`
- **When** se envía `POST /api/camiones/AE123CD/mantenimientos` con `tipo`, `taller`, `costo`, `km_servicio` y `cambiar_estado: "en_mantenimiento"`
- **Then** responde HTTP `200 OK`
- **And** MongoDB inserta el subdocumento en el array `mantenimientos` vía `$push`
- **And** actualiza simultáneamente el estado del camión a `en_mantenimiento`.

### Escenario 2: Asentamiento en Unidad Inexistente
- **Given** una patente que no existe en el sistema
- **When** se intenta registrar un mantenimiento
- **Then** `matchedCount` es `0`
- **And** la API responde HTTP `404 Not Found`.
