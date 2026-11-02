# US-TDD-001: Construcción Paso a Paso del Chofer (Metodología Kent Beck / Baby Steps)

**Como** Desarrollador guiado por pruebas (TDD Practitioner)  
**Quiero** construir la entidad y el endpoint de creación de Chofer mediante micro-pasos de prueba que fallen (Red), pasen con código mínimo (Green) y se refactoricen (Refactor)  
**Para** garantizar que cada regla de validación de negocio (presencia, tipo numérico, longitudes mínimas y máximas) nazca exclusivamente a partir de un test previo.

---

## Ciclo de Micro-Pasos TDD (Baby Steps)

### Paso 1: Existencia de la Operación y Respuesta Base
- **Test (Red):** Enviar `POST /api/choferes` a un endpoint inexistente $\rightarrow$ Falla con `404 Not Found`.
- **Código Mínimo (Green):** Crear la ruta `POST /api/choferes` respondiendo un estado base.

---

### Paso 2: Requerimiento Obligatorio del DNI
- **Test (Red):** Enviar `POST /api/choferes` con cuerpo vacío `{}` $\rightarrow$ Falla si el sistema acepta la petición.
- **Expectativa:** Debe responder HTTP `400 Bad Request` indicando que el DNI es obligatorio.
- **Código Mínimo (Green):**
  ```javascript
  if (!dni) return res.status(400).json({ error: 'El DNI es obligatorio' });
  ```

---

### Paso 3: Validación de Formato Numérico del DNI
- **Test (Red):** Enviar un DNI con letras o símbolos alfanuméricos (ej. `"38A45B89"` o `"DNI-1234"`) $\rightarrow$ Debe ser rechazado.
- **Expectativa:** Debe responder HTTP `400 Bad Request` indicando que el DNI debe contener exclusivamente dígitos numéricos.
- **Código Mínimo (Green):**
  ```javascript
  if (!/^\d+$/.test(dni)) return res.status(400).json({ error: 'El DNI debe contener únicamente números' });
  ```

---

### Paso 4: Límite Inferior de Longitud del DNI (Mínimo 7 Dígitos)
- **Test (Red):** Enviar un DNI con menos de 7 cifras (ej. `"123456"`) $\rightarrow$ Debe ser rechazado.
- **Expectativa:** Debe responder HTTP `400 Bad Request` con mensaje explicativo de longitud mínima.
- **Código Mínimo (Green):**
  ```javascript
  if (dni.length < 7) return res.status(400).json({ error: 'El DNI no puede tener menos de 7 dígitos' });
  ```

---

### Paso 5: Límite Superior de Longitud del DNI (Máximo 8 Dígitos)
- **Test (Red):** Enviar un DNI con más de 8 cifras (ej. `"123456789"`) $\rightarrow$ Debe ser rechazado.
- **Expectativa:** Debe responder HTTP `400 Bad Request` con mensaje explicativo de longitud máxima.
- **Código Mínimo (Green):**
  ```javascript
  if (dni.length > 8) return res.status(400).json({ error: 'El DNI no puede tener más de 8 dígitos' });
  ```

---

### Paso 6: Requerimiento y Longitud Mínima del Nombre
- **Test (Red):** Enviar un chofer con DNI válido pero sin nombre o con nombre de 1 letra (ej. `"A"`) $\rightarrow$ Debe ser rechazado.
- **Expectativa:** Debe responder HTTP `400 Bad Request` indicando que el nombre es obligatorio y debe tener al menos 3 caracteres.
- **Código Mínimo (Green):**
  ```javascript
  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre es obligatorio y debe tener al menos 3 caracteres' });
  }
  ```

---

### Paso 7: Requerimiento de Teléfono de Contacto
- **Test (Red):** Enviar datos válidos pero omitiendo el teléfono $\rightarrow$ Debe responder HTTP `400 Bad Request`.
- **Código Mínimo (Green):**
  ```javascript
  if (!telefono || telefono.trim().length < 6) {
    return res.status(400).json({ error: 'El teléfono es obligatorio y debe tener al menos 6 caracteres' });
  }
  ```

---

### Paso 8: Estructura Estricta de Licencia Habilitante
- **Test (Red):** Enviar solicitud sin `licencia.categoria` o sin `licencia.vencimiento` $\rightarrow$ Debe responder HTTP `400 Bad Request` sin aplicar categorías por defecto ni tolerar campos vacíos.
- **Código Mínimo (Green):**
  ```javascript
  if (!licencia || !licencia.categoria || !licencia.vencimiento) {
    return res.status(400).json({ error: 'licencia.categoria y licencia.vencimiento son obligatorios' });
  }
  ```

---

### Paso 9: Persistencia y Conflicto de Duplicidad (Unicidad)
- **Test (Red):** Enviar un chofer con todos los datos válidos dos veces seguidas con el mismo DNI $\rightarrow$ La segunda petición debe fallar con `409 Conflict`.
- **Código Mínimo (Green):** Verificación del índice único en MongoDB capturando el código de error `11000`.
