# US-003 Baby Step: Intento de despacho sin destino
POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "AA123BB",
  "chofer_dni": "35123456",
  "origen": "Buenos Aires",
  "carga_descripcion": "Materiales",
  "peso_kg": 15000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "Faltan parámetros del viaje"
