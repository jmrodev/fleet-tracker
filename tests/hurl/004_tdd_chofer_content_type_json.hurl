# 004_tdd_chofer_content_type_json.hurl
# Micro-Paso 0D [TDD Contract]: La respuesta del servidor debe ser obligatoriamente de tipo JSON.
# No se admiten respuestas en texto plano ni HTML.

POST {{host}}/api/choferes
Content-Type: application/json
{}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
