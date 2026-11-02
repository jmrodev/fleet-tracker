# 011_tdd_chofer_dni_demasiado_corto_1_cifra.hurl
# Micro-Paso 1E [TDD Red]: Se envía un DNI con 1 solo dígito numérico.
# Expectativa: Falla por longitud mínima de documento argentino (mínimo 7 cifras).

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "5",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" contains "menos de 7"
