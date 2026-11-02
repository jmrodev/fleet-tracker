# 026_tdd_chofer_duplicado_conflicto_409.hurl
# Micro-Paso 5C [TDD Red / Invariante Motor]: Se intenta registrar un chofer con un DNI ya existente (88776655).
# Expectativa: El motor rechaza la operación por índice único y responde 409 Conflict.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "88776655",
  "nombre": "Clon Chofer",
  "telefono": "+542494000000",
  "licencia": {
    "categoria": "E1",
    "vencimiento": "2028-11-30"
  }
}

HTTP 409
[Asserts]
status == 409
jsonpath "$.error" contains "ya existe"
