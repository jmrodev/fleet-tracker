# US-003 Baby Step: Intento de despacho con peso menor o igual a cero
POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "AA123BB",
  "chofer_dni": "35123456",
  "origen": "Buenos Aires",
  "destino": "Rosario",
  "carga_descripcion": "Materiales",
  "peso_kg": 0
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
