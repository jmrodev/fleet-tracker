# 010_tdd_chofer_dni_con_simbolos.hurl
# Micro-Paso 1D [TDD Red]: Se envía un DNI con puntos o guiones (ej. 35.444.888 o 35-444).
# Expectativa: Falla exigiendo únicamente dígitos numéricos sin separadores.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35.444.888",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "números"
