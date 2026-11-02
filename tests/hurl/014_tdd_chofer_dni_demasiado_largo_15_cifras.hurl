# 014_tdd_chofer_dni_demasiado_largo_15_cifras.hurl
# Micro-Paso 1H [TDD Red]: Se envía un número arbitrariamente largo simulando desborde o inyección.
# Expectativa: Falla por longitud máxima de 8 dígitos.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "123456789012345",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "más de 8"
