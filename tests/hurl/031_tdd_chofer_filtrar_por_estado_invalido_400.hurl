# 031_tdd_chofer_filtrar_por_estado_invalido_400.hurl
# Micro-Paso 8B [TDD Lifecycle]: Intento de filtrar choferes por un estado no reconocido por la máquina de estados ('inactivo').
# Expectativa: 400 Bad Request indicando los estados permitidos.

GET {{host}}/api/choferes?estado=inactivo

HTTP 400
[Asserts]
status == 400
jsonpath "$.error" contains "Filtro de estado inválido"
