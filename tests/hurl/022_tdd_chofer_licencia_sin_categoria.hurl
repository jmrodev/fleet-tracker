# 022_tdd_chofer_licencia_sin_categoria.hurl
# Micro-Paso 4B [TDD Red]: Objeto licencia presente con fecha de vencimiento pero sin categoría.
# Expectativa: Falla exigiendo 'licencia.categoria' sin asumir categorías mágicas.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "Carlos Santana",
  "telefono": "+542494112233",
  "licencia": {
    "vencimiento": "2028-10-15"
  }
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "licencia.categoria"
