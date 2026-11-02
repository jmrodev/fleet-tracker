# 029_tdd_chofer_actualizar_telefono.hurl
# Micro-Paso 7A [TDD Lifecycle]: Modificación parcial del chofer existente (PUT).
# Expectativa: 200 OK con el campo teléfono modificado.

PUT {{host}}/api/choferes/88776655
Content-Type: application/json
{
  "telefono": "+542494119988"
}

HTTP 200
[Asserts]
status == 200
jsonpath "$.telefono" == "+542494119988"
