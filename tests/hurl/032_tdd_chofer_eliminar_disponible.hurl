# 032_tdd_chofer_eliminar_disponible.hurl
# Micro-Paso 9A [TDD Lifecycle]: Eliminación controlada de un chofer en estado 'disponible' (DELETE).
# Expectativa: 200 OK confirmando la baja en base de datos.

DELETE {{host}}/api/choferes/8765432

HTTP 200
[Asserts]
status == 200
jsonpath "$.success" == true
