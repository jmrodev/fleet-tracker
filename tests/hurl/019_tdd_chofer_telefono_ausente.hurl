# 019_tdd_chofer_telefono_ausente.hurl
# Micro-Paso 3A [TDD Red]: DNI y nombre válidos pero se omite el teléfono.
# Expectativa: Falla exigiendo teléfono de contacto.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "teléfono"
