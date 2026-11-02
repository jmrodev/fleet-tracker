# US-004: Finalización de Viajes y Odometría Monótona

**Como** Supervisor de Tráfico y Liquidaciones  
**Quiero** registrar la llegada de un camión, asentando el kilometraje final y liberando recursos  
**Para** computar la distancia real recorrida y asegurar que el odómetro del vehículo solo aumente monótonamente mediante el operador `$max` de MongoDB.

---

## 🛠️ Especificación de Capacidades MongoDB en Juego
1. **Operador Atómico Monótono (`$max`):**
   - En sistemas de flotas, un error de reporte no debe poder retroceder el kilometraje real de la unidad.
   - MongoDB provee la mutación atómica:
     ```javascript
     db.collection('camiones').updateOne(
       { patente: viaje.camion_patente },
       {
         $set: { estado: 'disponible' },
         $max: { kilometraje_actual: kmFin }
       }
     )
     ```
   - Si `kmFin` fuese inferior al kilometraje registrado, el operador `$max` retiene el valor superior de forma transparente.
2. **Identificador Canónico `ObjectId`:**
   - La búsqueda y actualización del viaje se ejecuta mediante el identificador nativo `_id: new ObjectId(id)`.

---

## Criterios de Aceptación (BDD)

### Escenario 1: Llegada Exitosa y Actualización con `$max`
- **Given** un viaje en estado `en_curso` con `km_salida: 80000`
- **When** se envía `PUT /api/viajes/{id}/finalizar` con `km_llegada: 80450`
- **Then** responde HTTP `200 OK`
- **And** persiste el viaje con `estado: "finalizado"` y `km_recorridos: 450`
- **And** actualiza el camión a `estado: "disponible"` con `kilometraje_actual: 80450` vía `$max`
- **And** libera al chofer a `estado: "disponible"`.

### Escenario 2: Rechazo por Kilometraje Incoherente
- **Given** un viaje con `km_salida: 80000`
- **When** se intenta finalizar con `km_llegada: 79000`
- **Then** la API responde HTTP `400 Bad Request` indicando que el odómetro de llegada no puede ser menor al de salida.
