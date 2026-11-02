# 018_tdd_chofer_nombre_demasiado_corto_2_letras.hurl
# Micro-Paso 2D [TDD Red]: Se envía un nombre en la cota de 2 letras (ej. Al).
# Expectativa: Falla exigiendo cota mínima de 3 caracteres.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "Al"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "al menos 3"
