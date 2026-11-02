# US-001 Baby Step: Intento de alta con año ilógico (ej: menor a 1950 o futuro lejano)
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "TDD999",
  "marca": "Scania",
  "modelo": "R450",
  "anio": 1820,
  "capacidad_kg": 28000,
  "kilometraje_actual": 120000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "anio"
