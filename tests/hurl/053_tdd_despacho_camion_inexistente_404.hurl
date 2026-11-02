# US-003 Baby Step: Caso Borde - Camión no existe en base de datos
POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "NOEXISTE99",
  "chofer_dni": "35123456",
  "origen": "Buenos Aires",
  "destino": "Rosario",
  "carga_descripcion": "Materiales de construcción",
  "peso_kg": 10000
}

HTTP 404
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "Camión"
