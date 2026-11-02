# US-001 Baby Step: Eliminación física de la unidad disponible y verificación posterior de 404
DELETE {{host}}/api/camiones/AA123BB

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.success" == true

GET {{host}}/api/camiones/AA123BB

HTTP 404
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
