# 030_tdd_chofer_filtrar_por_estado_valido.hurl
# Micro-Paso 8A [TDD Lifecycle]: Listado de choferes filtrando por estado operacional ('disponible').
# Expectativa: 200 OK y todos los elementos del arreglo tienen estado 'disponible'.

GET {{host}}/api/choferes?estado=disponible

HTTP 200
[Asserts]
status == 200
jsonpath "$" isCollection
