# 027_tdd_chofer_obtener_por_dni.hurl
# Micro-Paso 6A [TDD Lifecycle]: Consulta individual del chofer creado mediante su clave primaria.
# Expectativa: 200 OK con los datos exactos del chofer.

GET {{host}}/api/choferes/88776655

HTTP 200
[Asserts]
status == 200
jsonpath "$.dni" == "88776655"
jsonpath "$.nombre" == "Laura Pausini"
jsonpath "$.licencia.categoria" == "E1"
