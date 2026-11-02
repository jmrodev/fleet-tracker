# Cierre y verificación de idempotencia: Liberación y limpieza de entidades de prueba
DELETE {{host}}/api/camiones/DISPO01

HTTP 200

DELETE {{host}}/api/camiones/DISPO02

HTTP 200

DELETE {{host}}/api/choferes/44999888

HTTP 200

DELETE {{host}}/api/choferes/44999777

HTTP 200
