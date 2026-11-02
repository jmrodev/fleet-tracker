# Mapeo Técnico de Capacidades MongoDB en la Arquitectura

Este documento explicita **dónde reside cada funcionalidad de MongoDB nativo (sin ORM)** en el código fuente de `fleet-tracker`.

---

## 1. Dónde está la persistencia y operaciones de MongoDB

Todo el acceso a datos reside exclusivamente en la capa **`server/repositories/`** y la inicialización en **`server/config/`**:

| Capacidad MongoDB | Archivo de Código | Función / Método | Operador / Característica |
| :--- | :--- | :--- | :--- |
| **Connection Pooling & Auto-Index** | [server/config/db.js](file:///home/jmro/Documents/Development/fleet-tracker/server/config/db.js) | `connectDB()` | `MongoClient`, `createIndex({ unique: true })` |
| **Índice Único B-Tree (Unicidad en motor)** | [server/config/db.js](file:///home/jmro/Documents/Development/fleet-tracker/server/config/db.js) | `connectDB()` | `{ patente: 1 }, { unique: true }`, `{ dni: 1 }, { unique: true }` |
| **Compare-And-Swap Atómico (CAS)** | [server/repositories/camiones.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/camiones.repository.js) | `reserveAtomic()` | `findOneAndUpdate({ estado: 'disponible', capacidad_kg: { $gte } })` |
| **Compare-And-Swap Atómico Chofer** | [server/repositories/choferes.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/choferes.repository.js) | `reserveAtomic()` | `findOneAndUpdate({ dni, estado: 'disponible' })` |
| **Modificación Atómica de Odómetro** | [server/repositories/camiones.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/camiones.repository.js) | `releaseAtomic()` | `updateOne({ $max: { kilometraje_actual: finalKm } })` |
| **Documentos Embebidos (Embedding)** | [server/repositories/camiones.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/camiones.repository.js) | `pushMantenimiento()` | `updateOne({ $push: { mantenimientos: subdoc } })` |
| **Aggregation Framework (Pipeline)** | [server/repositories/camiones.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/camiones.repository.js) | `aggregateGastosMantenimiento()` | `aggregate([{ $unwind }, { $group: { $sum, $avg } }, { $sort }])` |
| **Aggregation Framework (Match + Sum)** | [server/repositories/viajes.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/viajes.repository.js) | `aggregateKmFinalizados()` | `aggregate([{ $match: { estado: 'finalizado' } }, { $group: { $sum } }])` |
| **Paginación Defensiva en Cursor** | [server/repositories/camiones.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/camiones.repository.js) | `findWithFilter()` | `.find().sort().skip().limit().toArray()` |
| **Identificadores BSON Nativos** | [server/repositories/viajes.repository.js](file:///home/jmro/Documents/Development/fleet-tracker/server/repositories/viajes.repository.js) | `findById()` | `ObjectId(id)` con validación de 24 caracteres hex |
| **Concurrencia sin Bloqueo de Tablas** | Motor WiredTiger nativo de MongoDB Atlas | Todas las mutaciones | Bloqueo a nivel documento (*document-level locking*) |
