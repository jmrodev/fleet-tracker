# 017_tdd_chofer_nombre_demasiado_corto_1_letra.hurl
# Micro-Paso 2C [TDD Red]: Se envía un nombre de 1 solo caracter.
# Expectativa: Falla exigiendo al menos 3 caracteres.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "J"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "al menos 3"
