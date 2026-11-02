# 025_tdd_chofer_creacion_exitosa_8_digitos.hurl
# Micro-Paso 5B [TDD Green]: Todos los campos válidos con DNI de 8 cifras (cota regular estándar).
# Expectativa: 201 Created.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "88776655",
  "nombre": "Laura Pausini",
  "telefono": "+542494556677",
  "licencia": {
    "categoria": "E1",
    "vencimiento": "2028-11-30"
  }
}

HTTP 201
[Asserts]
status == 201
jsonpath "$.dni" == "88776655"
jsonpath "$.estado" == "disponible"
