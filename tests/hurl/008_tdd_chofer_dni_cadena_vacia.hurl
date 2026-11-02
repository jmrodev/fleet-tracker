# 008_tdd_chofer_dni_cadena_vacia.hurl
# Micro-Paso 1B [TDD Red]: Se envía el campo 'dni' pero como cadena vacía o espacios en blanco.
# Expectativa: Falla porque un DNI en blanco no es admisible.

POST {{host}}/api/choferes
Content-Type: application/json
{
  "dni": "   ",
  "nombre": "Carlos Santana"
}

HTTP 400
[Asserts]
jsonpath "$.error" exists
