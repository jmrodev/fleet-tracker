# US-003 Baby Step: Caso Borde - Chofer inexistente en nómina debe responder 404
# Primero creamos camión temporal para aislar la validación del chofer
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "DISPO01",
  "marca": "Iveco",
  "modelo": "Stralis",
  "anio": 2021,
  "capacidad_kg": 25000,
  "kilometraje_actual": 80000
}

HTTP 201

POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "DISPO01",
  "chofer_dni": "00000000",
  "origen": "Buenos Aires",
  "destino": "Rosario",
  "carga_descripcion": "Materiales de construcción",
  "peso_kg": 10000
}

HTTP 404
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "Chofer"
