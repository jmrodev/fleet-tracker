# 006_tdd_chofer_rechazo_cuerpo_vacio.hurl
# Micro-Paso 0F [TDD Boundary]: Se envía un cuerpo de petición completamente vacío sin propiedades.
# El sistema rechaza la operación exigiendo datos obligatorios.

POST {{host}}/api/choferes
Content-Type: application/json
{}

HTTP 400
[Asserts]
jsonpath "$.error" contains "obligatorio"
