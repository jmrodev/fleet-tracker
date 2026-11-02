# US-001 Baby Step: Obtener datos de la unidad existente por patente
GET {{host}}/api/camiones/AA123BB

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.patente" == "AA123BB"
jsonpath "$.marca" == "Scania"
jsonpath "$.estado" == "disponible"
