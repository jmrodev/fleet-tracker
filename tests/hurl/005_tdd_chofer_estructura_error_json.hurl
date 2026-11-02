# 005_tdd_chofer_estructura_error_json.hurl
# Micro-Paso 0E [TDD Contract]: Ante un fallo de validación inicial, el cuerpo debe contener un campo 'error' explícito.
# No se permite que devuelva un objeto vacío {}.

POST {{host}}/api/choferes
Content-Type: application/json
{}

HTTP 400
[Asserts]
jsonpath "$.error" exists
jsonpath "$.error" isString
