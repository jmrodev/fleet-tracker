# US-005 Baby Step: Intento de registrar mantenimiento en unidad inexistente responde 404
POST {{host}}/api/camiones/INEXISTENTE/mantenimientos
Content-Type: application/json
{
  "tipo": "Alineación",
  "taller": "Taller Norte",
  "costo": 50000,
  "km_servicio": 10000
}

HTTP 404
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "INEXISTENTE"
