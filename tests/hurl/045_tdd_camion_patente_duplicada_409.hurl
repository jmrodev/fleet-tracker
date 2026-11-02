# US-001 Baby Step: Rechazo con 409 Conflict si la patente ya existe en base de datos
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "AA123BB",
  "marca": "Volvo",
  "modelo": "FH540",
  "anio": 2023,
  "capacidad_kg": 30000,
  "kilometraje_actual": 50000
}

HTTP 409
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "AA123BB"
