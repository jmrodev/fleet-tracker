# 021_tdd_chofer_licencia_ausente.hurl
# Micro-Paso 4A [TDD Red]: DNI, nombre y teléfono válidos pero se omite el objeto 'licencia'.
# Expectativa: Falla exigiendo el bloque de licencia habilitante.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "Carlos Santana",
  "telefono": "+542494112233"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "licencia"
