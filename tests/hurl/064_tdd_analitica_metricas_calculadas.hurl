# US-006 Baby Step: Consulta de analítica y agregación de costos de flota
GET {{host}}/api/stats/flota

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.total_camiones" exists
jsonpath "$.total_en_viaje" exists
jsonpath "$.total_mantenimiento" exists
jsonpath "$.km_flota_recorridos" exists
jsonpath "$.viajes_finalizados" exists
jsonpath "$.gasto_mantenimiento_por_marca" exists
