# US-001 Baby Step: Intento de alta sin capacidad_kg
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "TDD999",
  "marca": "Scania",
  "modelo": "R450",
  "anio": 2022,
  "kilometraje_actual": 120000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "capacidad_kg"
