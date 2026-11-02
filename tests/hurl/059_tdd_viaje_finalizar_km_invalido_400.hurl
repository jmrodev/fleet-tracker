# US-004 Baby Step: Finalizar viaje con km_llegada menor a km_salida debe responder 400
GET {{host}}/api/viajes?estado=en_curso

HTTP 200
[Asserts]
jsonpath "$[0].km_salida" == 80000
[Captures]
viaje_id: jsonpath "$[0]._id"

PUT {{host}}/api/viajes/{{viaje_id}}/finalizar
Content-Type: application/json
{
  "km_llegada": 79000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "menor al de salida"
