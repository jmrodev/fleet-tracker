# 007_tdd_chofer_dni_ausente.hurl
# Micro-Paso 1A [TDD Red]: Se envían campos secundarios pero se omite completamente el campo 'dni'.
# Expectativa: Falla exigiendo explícitamente el DNI.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "DNI"
