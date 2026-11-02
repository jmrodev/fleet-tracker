# 015_tdd_chofer_nombre_ausente.hurl
# Micro-Paso 2A [TDD Red]: DNI válido (8 cifras) pero se omite el campo 'nombre'.
# Expectativa: Falla exigiendo el nombre.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "nombre"
