# US-003 Baby Step: Caso Borde - Reintento de despacho con chofer ya asignado a viaje activo (409)
POST {{host}}/api/camiones
Content-Type: application/json
{
  "patente": "DISPO02",
  "marca": "Scania",
  "modelo": "G410",
  "anio": 2020,
  "capacidad_kg": 26000,
  "kilometraje_actual": 95000
}

HTTP 201

# El chofer 44999888 ya está en viaje con DISPO01
POST {{host}}/api/viajes
Content-Type: application/json
{
  "camion_patente": "DISPO02",
  "chofer_dni": "44999888",
  "origen": "Buenos Aires",
  "destino": "Mendoza",
  "carga_descripcion": "Carga complementaria",
  "peso_kg": 12000
}

HTTP 409
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.error" exists
jsonpath "$.error" contains "no está disponible"
