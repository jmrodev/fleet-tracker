# 016_tdd_chofer_nombre_cadena_vacia.hurl
# Micro-Paso 2B [TDD Red]: Se envía el nombre compuesto exclusivamente por espacios en blanco.
# Expectativa: Falla exigiendo nombre no vacío.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "     "
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "nombre"
