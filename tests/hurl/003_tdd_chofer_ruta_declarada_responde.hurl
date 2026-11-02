# 003_tdd_chofer_ruta_declarada_responde.hurl
# Micro-Paso 0C [TDD Green]: Primer código mínimo del endpoint.
# La función existe, la ruta atiende la solicitud HTTP y responde sin colapsar.

POST {{host}}/api/choferes
Content-Type: application/json
{}

HTTP 400
[Asserts]
status == 400
