# US-003 Baby Step: Caso Borde - Reintento de despacho con camión ya en viaje (409 Conflict)
POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "44999777",
  "nombre": "Segundo Conductor",
  "telefono": "+54911888877",
  "licencia": {
    "categoria": "E1",
    "vencimiento": "2030-01-01"
  }
}

HTTP 201

POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "DISPO01",
  "chofer_dni": "44999777",
  "origen": "Buenos Aires",
  "destino": "Cordoba",
  "carga_descripcion": "Carga secundaria",
  "peso_kg": 10000
}

HTTP 409
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "disponible"
