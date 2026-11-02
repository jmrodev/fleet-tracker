# 028_tdd_chofer_obtener_inexistente_404.hurl
# Micro-Paso 6B [TDD Lifecycle]: Consulta de un chofer con DNI que no existe en el motor.
# Expectativa: 404 Not Found.

GET {{host}}/api/choferes/99999999

HTTP 404
[Asserts]
status == 404
jsonpath "$.error" contains "no encontrado"
