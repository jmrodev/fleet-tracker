# US-001 Baby Step: Obtener camión inexistente debe responder 404
GET {{host}}/api/camiones/ZZZ999

HTTP 404
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "ZZZ999"
