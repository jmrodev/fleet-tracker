# 009_tdd_chofer_dni_con_letras.hurl
# Micro-Paso 1C [TDD Red]: Se envía un DNI con letras o símbolos alfanuméricos.
# Expectativa: Falla exigiendo formato numérico puro.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35A44B88",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "números"
