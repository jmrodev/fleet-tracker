# 002_tdd_chofer_verbo_incorrecto.hurl
# Micro-Paso 0B [TDD Red]: Se intenta invocar la creación mediante un método HTTP no permitido (ej. PATCH en vez de POST).
# Expectativa: El servidor rechaza la invocación con 404/405 porque la creación solo atiende POST.

PATCH {{host}}/api/choferes
Content-Type: application/json
{}

HTTP 404
