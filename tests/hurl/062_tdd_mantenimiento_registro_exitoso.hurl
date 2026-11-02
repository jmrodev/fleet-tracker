# US-005 Baby Step: Asentamiento de mantenimiento técnico atómico vía $push
POST {{host}}/api/camiones/DISPO01/mantenimientos
Content-Type: application/json
{
  "tipo": "Service Oficial 80k",
  "taller": "Taller Central Scania",
  "costo": 185000,
  "km_servicio": 80450,
  "detalles": "Cambio de filtros y aceite sintético",
  "cambiar_estado": "en_mantenimiento"
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.success" == true
jsonpath "$.mantenimiento.tipo" == "Service Oficial 80k"
jsonpath "$.mantenimiento.costo" == 185000

# Verificamos que el camión pasó a 'en_mantenimiento' y tiene el mantenimiento en su array
GET {{host}}/api/camiones/DISPO01

HTTP 200
[Asserts]
jsonpath "$.estado" == "en_mantenimiento"
jsonpath "$.mantenimientos" count == 1
jsonpath "$.mantenimientos[0].tipo" == "Service Oficial 80k"
