# US-001 Baby Step: Registro exitoso de una unidad con datos válidos
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "AA123BB",
  "marca": "Scania",
  "modelo": "R450",
  "anio": 2022,
  "capacidad_kg": 28000,
  "kilometraje_actual": 120000,
  "foto_url": "https://example.com/truck.jpg"
}

HTTP 201
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$._id" exists
jsonpath "$.patente" == "AA123BB"
jsonpath "$.marca" == "Scania"
jsonpath "$.modelo" == "R450"
jsonpath "$.anio" == 2022
jsonpath "$.capacidad_kg" == 28000
jsonpath "$.kilometraje_actual" == 120000
jsonpath "$.estado" == "disponible"
jsonpath "$.mantenimientos" count == 0
