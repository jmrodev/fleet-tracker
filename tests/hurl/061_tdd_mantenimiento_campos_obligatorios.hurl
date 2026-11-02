# US-005 Baby Step: Mantenimiento sin tipo o taller responde 400
POST {{host}}/api/camiones/DISPO01/mantenimientos
Content-Type: application/json
{
  "costo": 150000,
  "km_servicio": 80450
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "obligatorios"
