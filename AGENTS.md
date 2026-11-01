# Reglas de Gobernanza Chelo-Harness (Spec-First)

## 1. PRINCIPIO SAGRADO: DESACOPLAMIENTO TOTAL
- El Backend y el Frontend NO se comunican directamente en etapa de diseño ni se esperan para desarrollar.
- La ÚNICA fuente de verdad compartida es `openapi.yaml`.
- El Frontend consume `http://localhost:4010` (Prism Mock Server).
- El Backend implementa la lógica contra `:8000` validada por `chelo-harness test`.

## 2. RESTRICCIÓN DE ENDPOINTS
- Todo endpoint DEBE provenir de un User Story formal en `docs/stories/*.md` y de sus criterios BDD (Given/When/Then).

## 3. LÍMITE DE CONTENCIÓN
- Máximo 10 archivos modificados por ticket (Freno de seguridad del Quality Gate).
