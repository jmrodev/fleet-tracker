# US-001 Baby Step: Intento de alta con patente solo espacios en blanco
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "   ",
  "marca": "Scania",
  "modelo": "R450",
  "anio": 2022,
  "capacidad_kg": 28000,
  "kilometraje_actual": 120000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "patente"
