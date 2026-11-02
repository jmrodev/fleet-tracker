# US-001 Baby Step: Intento de alta con capacidad_kg menor o igual a cero
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "TDD999",
  "marca": "Scania",
  "modelo": "R450",
  "anio": 2022,
  "capacidad_kg": 0,
  "kilometraje_actual": 120000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "capacidad_kg"
