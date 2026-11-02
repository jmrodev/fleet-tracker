# US-004 Baby Step: Finalizar viaje exitosamente, computar km y liberar camión y chofer
GET {{host}}/api/viajes?estado=en_curso

HTTP 200
[Captures]
viaje_id: jsonpath "$[0]._id"

PUT {{host}}/api/viajes/{{viaje_id}}/finalizar
Content-Type: application/json
{
  "km_llegada": 80450
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.success" == true
jsonpath "$.km_recorridos" == 450

# Verificamos que el camión DISPO01 fue actualizado con su nuevo odómetro y estado disponible
GET {{host}}/api/camiones/DISPO01

HTTP 200
[Asserts]
jsonpath "$.kilometraje_actual" == 80450
jsonpath "$.estado" == "disponible"

# Verificamos que el chofer 44999888 quedó disponible
GET {{host}}/api/choferes/44999888

HTTP 200
[Asserts]
jsonpath "$.estado" == "disponible"
