# US-001 Baby Step: Intento de alta con kilometraje_actual negativo
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "TDD999",
  "marca": "Scania",
  "modelo": "R450",
  "anio": 2022,
  "capacidad_kg": 28000,
  "kilometraje_actual": -50
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "kilometraje_actual"
