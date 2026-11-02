# US-003 Baby Step: Despacho exitoso con carga dentro de tolerancia
POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "DISPO01",
  "chofer_dni": "44999888",
  "origen": "Buenos Aires",
  "destino": "Rosario",
  "carga_descripcion": "Carga estándar",
  "peso_kg": 18000
}

HTTP 201
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$._id" exists
jsonpath "$.estado" == "en_curso"
jsonpath "$.km_salida" == 80000
jsonpath "$.camion_patente" == "DISPO01"
jsonpath "$.chofer_dni" == "44999888"
