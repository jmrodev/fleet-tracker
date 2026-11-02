# 024_tdd_chofer_creacion_exitosa_7_digitos.hurl
# Micro-Paso 5A [TDD Green]: Todos los campos válidos con DNI de 7 cifras (cota mínima permitida).
# Expectativa: 201 Created, persiste con estado 'disponible'.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "8765432",
  "nombre": "Esteban Quito",
  "telefono": "+542494998877",
  "licencia": {
    "categoria": "E1",
    "vencimiento": "2029-01-20"
  }
}

HTTP 201
[Asserts]
status == 201
jsonpath "$.dni" == "8765432"
jsonpath "$.nombre" == "Esteban Quito"
jsonpath "$.estado" == "disponible"
