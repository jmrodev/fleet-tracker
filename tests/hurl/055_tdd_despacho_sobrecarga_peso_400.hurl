# US-003 Baby Step: Caso Borde - Rechazo por sobrecarga de peso > capacidad_kg
POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "44999888",
  "nombre": "Conductor Test",
  "telefono": "+54911223344",
  "licencia": {
    "categoria": "E1",
    "vencimiento": "2030-01-01"
  }
}

HTTP 201

# Camión DISPO01 tiene 25000 kg. Intentamos despachar con 30000 kg.
POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "DISPO01",
  "chofer_dni": "44999888",
  "origen": "Buenos Aires",
  "destino": "Rosario",
  "carga_descripcion": "Carga pesada industrial",
  "peso_kg": 30000
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "supera la capacidad"
