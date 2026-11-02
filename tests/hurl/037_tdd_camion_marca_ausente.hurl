# US-001 Baby Step: Intento de alta de camión sin marca
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "TDD999",
  "modelo": "R450",
  "anio": 2022,
  "capacidad_kg": 28000,
  "kilometraje_actual": 120000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "marca"
