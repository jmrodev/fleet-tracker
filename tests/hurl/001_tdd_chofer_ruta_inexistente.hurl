# 001_tdd_chofer_ruta_inexistente.hurl
# Micro-Paso 0A [TDD Red]: Se intenta invocar una ruta que aún no ha sido declarada en el sistema.
# Expectativa: El servidor debe responder 404 Not Found porque el endpoint no existe en este punto.

POST {{host}}/api/modulo_chofer_no_existe
Content-Type: application/json
{}

HTTP 404
