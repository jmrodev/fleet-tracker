# 1. Healthcheck
GET http://localhost:4010/api/health
HTTP 200

# 2. Listado de Camiones y Choferes
GET http://localhost:4010/api/camiones
HTTP 200

GET http://localhost:4010/api/choferes
HTTP 200

# 3. Métricas y KPIs de la Flota
GET http://localhost:4010/api/stats/flota
HTTP 200

# 4. Detalle individual (GET por clave primaria)
GET http://localhost:4010/api/camiones/AE123CD
HTTP 200

GET http://localhost:4010/api/choferes/28456789
HTTP 200

# 5. Modificación de Camión (PUT)
PUT http://localhost:4010/api/camiones/AE123CD
Content-Type: application/json
{
  "capacidad_kg": 29000,
  "kilometraje_actual": 150000,
  "estado": "disponible"
}
HTTP 200

# 6. Modificación de Chofer (PUT)
PUT http://localhost:4010/api/choferes/28456789
Content-Type: application/json
{
  "telefono": "+54 249 4556677",
  "estado": "disponible"
}
HTTP 200

# 7. Eliminación (DELETE)
DELETE http://localhost:4010/api/camiones/AE123CD
HTTP 200

DELETE http://localhost:4010/api/choferes/28456789
HTTP 200
