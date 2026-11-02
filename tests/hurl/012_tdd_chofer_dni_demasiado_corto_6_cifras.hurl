# 012_tdd_chofer_dni_demasiado_corto_6_cifras.hurl
# Micro-Paso 1F [TDD Red]: Se envía un DNI en el límite inferior estricto no permitido (6 cifras).
# Expectativa: Falla exactamente en la cota de 6 dígitos.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "123456",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "menos de 7"
