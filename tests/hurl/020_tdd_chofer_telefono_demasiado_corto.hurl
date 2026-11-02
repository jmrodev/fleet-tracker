# 020_tdd_chofer_telefono_demasiado_corto.hurl
# Micro-Paso 3B [TDD Red]: Se envía un teléfono con menos de 6 caracteres (ej. '123').
# Expectativa: Falla exigiendo al menos 6 caracteres para número de contacto.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "Carlos Santana",
  "telefono": "123"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "al menos 6"
