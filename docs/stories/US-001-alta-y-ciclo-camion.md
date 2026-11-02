# US-001: Alta, Consulta y Ciclo de Vida del Camión

**Como** Jefe de Mantenimiento y Flota  
**Quiero** registrar vehículos de carga con patente y especificaciones técnicas en documentos BSON nativos  
**Para** garantizar la unicidad de inventario respaldada por índices B-Tree de MongoDB a nivel motor.

---

## 🛠️ Especificación de Capacidades MongoDB en Juego
1. **Índice B-Tree Único (`{ patente: 1 }, { unique: true }`):**
   - Garantiza a nivel motor (WiredTiger) que ninguna concurrencia pueda generar patentes duplicadas.
   - Rechazo con error nativo de colisión E11000 traducido a HTTP 409 Conflict.
2. **Índice Secundario de Búsqueda (`{ estado: 1 }`):**
   - Optimiza las consultas filtradas por estado operacional (`disponible`, `en_viaje`, `en_mantenimiento`) evitando escaneos completos de colección (`COLLSCAN`).
3. **Array Embebido Inicial (`mantenimientos: []`):**
   - Modela la hoja de vida técnica dentro del mismo documento raíz para lecturas en una sola operación de E/S.
4. **Paginación Defensiva por Cursor (`find().skip().limit()`):**
   - Evita desbordes de memoria buffer en Node.js mediante streaming acotado de BSON.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Registro Exitoso de Primer Camión (Inserción BSON)
- **Given** una patente válida no existente (ej. `AE123CD`)
- **When** se envía `POST /api/camiones` con `marca`, `modelo`, `anio`, `capacidad_kg`, `kilometraje_actual`
- **Then** responde HTTP `201 Created`
- **And** el motor MongoDB genera un `_id` tipo `ObjectId` nativo
- **And** persiste el documento BSON con `estado: "disponible"` y un array embebido `mantenimientos: []` vacío.

### Escenario 2: Rechazo por Patente Duplicada (Colisión E11000 en Motor)
- **Given** un camión ya registrado con patente `AE123CD`
- **When** se intenta enviar nuevamente un `POST /api/camiones` con la misma patente
- **Then** el índice único de MongoDB aborta la inserción con código de error de motor `11000`
- **And** la API responde limpiamente con HTTP `409 Conflict` sin caídas de proceso.

### Escenario 3: Rechazo por Invariantes de Dominio
- **Given** una petición sin `patente` o con `capacidad_kg <= 0`
- **When** se envía `POST /api/camiones`
- **Then** el servicio intercepta el payload y responde HTTP `400 Bad Request`.

### Escenario 4: Consulta de Camión Inexistente
- **Given** una patente que nunca fue registrada (ej. `ZZ999ZZ`)
- **When** se consulta `GET /api/camiones/ZZ999ZZ`
- **Then** la consulta `findOne()` devuelve `null` y la API responde HTTP `404 Not Found`.

### Escenario 5: Protección de Eliminación en Viaje Activo
- **Given** un camión con estado operacional `en_viaje`
- **When** se envía `DELETE /api/camiones/{patente}`
- **Then** el sistema verifica el estado antes de invocar `deleteOne()` y rechaza con HTTP `400 Bad Request`.
