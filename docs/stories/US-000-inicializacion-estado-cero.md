# US-000: Inicialización del Sistema y Estado Cero (Day Zero)

**Como** Administrador del Sistema Logístico  
**Quiero** inicializar la plataforma sin datos precargados (cero camiones, cero choferes, cero viajes)  
**Para** verificar que las APIs y las consultas analíticas respondan de forma segura y consistente con colecciones vacías antes de comenzar la operación.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Flota Vacía (Ningún Camión Registrado)
- **Given** que la base de datos no contiene documentos en la colección `camiones`
- **When** se envía una petición `GET /api/camiones`
- **Then** el sistema responde con HTTP `200 OK`
- **And** devuelve un arreglo vacío `[]`
- **And** no produce errores de ejecución `500` ni cuelgues.

### Escenario 2: Nómina Vacía (Ningún Chofer Registrado)
- **Given** que la colección `choferes` no contiene documentos
- **When** se envía una petición `GET /api/choferes`
- **Then** el sistema responde con HTTP `200 OK`
- **And** devuelve un arreglo vacío `[]`.

### Escenario 3: Historial Vacío (Ningún Viaje Registrado)
- **Given** que la colección `viajes` no contiene documentos
- **When** se envía una petición `GET /api/viajes`
- **Then** el sistema responde con HTTP `200 OK`
- **And** devuelve un arreglo vacío `[]`.

### Escenario 4: Analítica en Estado Cero
- **Given** una base de datos vacía sin viajes ni servicios técnicos
- **When** se consulta `GET /api/stats/flota`
- **Then** el sistema responde con HTTP `200 OK`
- **And** devuelve métricas con valores neutros:
  ```json
  {
    "total_camiones": 0,
    "total_en_viaje": 0,
    "total_mantenimiento": 0,
    "km_flota_recorridos": 0,
    "viajes_finalizados": 0,
    "gasto_mantenimiento_por_marca": []
  }
  ```
- **And** bajo ningún concepto devuelve `null`, `undefined` ni excepciones de agregación.
