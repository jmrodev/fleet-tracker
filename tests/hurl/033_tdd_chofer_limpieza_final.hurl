# 033_tdd_chofer_limpieza_final.hurl
# Micro-Paso 9B [TDD Cleanup]: Limpieza del chofer 88776655 utilizado durante el ciclo de pruebas.
# Garantiza idempotencia de la suite completa.

DELETE {{host}}/api/choferes/88776655

HTTP 200
[Asserts]
status == 200
jsonpath "$.success" == true
