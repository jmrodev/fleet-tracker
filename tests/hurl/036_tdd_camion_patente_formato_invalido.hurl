# US-001 Baby Step: Intento de alta con patente con caracteres especiales no alfanuméricos
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "AB-12#@",
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
