# US-006: Analítica de Costos y Agregación Multietapa (Aggregation Framework)

**Como** Director de Operaciones y Finanzas  
**Quiero** consultar estadísticas consolidadas de la flota, costos por marca y kilometrajes acumulados  
**Para** tomar decisiones financieras basadas en datos procesados nativamente en el motor MongoDB mediante el Aggregation Pipeline.

---

## 🛠️ Especificación de Capacidades MongoDB en Juego
1. **Pipeline de Agregación Multietapa (`aggregate`):**
   - En lugar de traer miles de registros a Node.js y procesarlos en bucles de JavaScript, todo el cálculo se delega a los núcleos C++ optimizados de MongoDB.
2. **Operador `$unwind`:**
   - Descompone el array embebido `mantenimientos` de cada camión, produciendo un stream de documentos individuales por cada servicio realizado.
3. **Agrupación y Cómputo Acumulado (`$group` + `$sum` + `$avg`):**
   - Agrupa los documentos desenrollados por `$marca` del camión.
   - Computa simultáneamente el gasto total (`$sum`), cantidad de servicios realizados (`$sum: 1`) y costo promedio por intervención (`$avg`).
4. **Ordenamiento en Servidor (`$sort`):**
   - Ordena los resultados por mayor costo incurrido (`{ total_gastado: -1 }`).
5. **Agregación Cruzada con `$match`:**
   - En la colección `viajes`, filtra exclusivamente `{ estado: 'finalizado' }` y totaliza los kilómetros recorridos por toda la compañía.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Endpoint de Analítica de Flota
- **Given** camiones con mantenimientos registrados de diversas marcas (Scania, Volvo, Iveco, etc.)
- **And** viajes en estados diversos (en_curso y finalizados)
- **When** se consulta `GET /api/stats/flota`
- **Then** responde HTTP `200 OK`
- **And** el cuerpo JSON contiene:
  - `total_camiones`: conteo total de unidades.
  - `total_en_viaje` y `total_mantenimiento`.
  - `km_flota_recorridos`: suma de `km_recorridos` solo de viajes finalizados.
  - `viajes_finalizados`: cantidad de viajes completados.
  - `gasto_mantenimiento_por_marca`: array ordenado descendentemente por `total_gastado`, con `servicios` y `costo_promedio` calculados por el motor.
