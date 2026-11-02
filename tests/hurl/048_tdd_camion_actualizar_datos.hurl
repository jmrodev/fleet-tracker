# US-001 Baby Step: Actualizar kilometraje y foto de la unidad existente
PUT {{host}}/api/camiones/AA123BB
Content-Type: application/json
{
  "kilometraje_actual": 125000,
  "foto_url": "https://example.com/truck_updated.jpg"
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.patente" == "AA123BB"
jsonpath "$.kilometraje_actual" == 125000
jsonpath "$.foto_url" == "https://example.com/truck_updated.jpg"
