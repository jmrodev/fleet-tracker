# 013_tdd_chofer_dni_demasiado_largo_9_cifras.hurl
# Micro-Paso 1G [TDD Red]: Se envía un DNI en la cota superior no permitida (9 cifras).
# Expectativa: Falla exactamente al superar 8 cifras.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "123456789",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "más de 8"
