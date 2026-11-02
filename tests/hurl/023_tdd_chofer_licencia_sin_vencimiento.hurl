# 023_tdd_chofer_licencia_sin_vencimiento.hurl
# Micro-Paso 4C [TDD Red]: Objeto licencia con categoría 'E1' pero sin fecha de vencimiento.
# Expectativa: Falla exigiendo 'licencia.vencimiento'.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "35444888",
  "nombre": "Carlos Santana",
  "telefono": "+542494112233",
  "licencia": {
    "categoria": "E1"
  }
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "licencia.vencimiento"
