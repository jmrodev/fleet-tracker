# Fleet Tracker — Sistema de Control de Flota, Viajes y Mantenimiento

Sistema integral de gestión logística desarrollado bajo la filosofía **Spec-First** y el estándar de calidad de **Linus Torvalds**.

---

## 🏗️ Arquitectura y Tecnologías
- **Base de Datos:** MongoDB 7.0 oficial en contenedor Docker.
- **Backend:** Node.js + Express con driver oficial nativo `mongodb` (cero capas ORM lentas/opacas).
- **Frontend:** Single-Page Application (SPA) nativa en tiempo real sin dependencias externas pesadas.
- **Gobernanza y Calidad:** **Chelo-Harness** (`AGENTS.md`, pruebas Hurl de contrato).
- **Inteligencia de Código:** **CodeGraph** indexado en `.codegraph/` para navegación semántica y análisis de impacto en un solo paso.

---

## ⚡ Inicio Rápido (3 Pasos)

### 1. Iniciar Base de Datos MongoDB
```bash
cd fleet-tracker
docker compose up -d
```

### 2. Iniciar el Servidor de Aplicación
```bash
npm start
```

### 3. Abrir la Plataforma
Navegar en el explorador a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧩 Modelo de Datos en MongoDB

1. **Camiones (`camiones`):**
   - Índice único: `{ patente: 1 }`
   - Documentos embebidos: Colección interna `mantenimientos: []` que crece de forma atómica con `$push`.
   - Estados de máquina finita: `disponible`, `en_viaje`, `en_mantenimiento`.

2. **Choferes (`choferes`):**
   - Índice único: `{ dni: 1 }`
   - Licencia estructurada y control de disponibilidad (`disponible`, `asignado`, `descanso`).

3. **Viajes (`viajes`):**
   - Control de carga vs capacidad máxima del vehículo asignado.
   - Odometría y cálculo de distancias reales recorridas.

4. **Aggregation Pipeline (`/api/stats/flota`):**
   - Desenrollado con `$unwind` de la colección embebida de mantenimientos.
   - Cálculo agrupado de costos totales y promedios por marca de camión (`$group` + `$sum` + `$avg`).

---

## 🛡️ Gobernanza con Chelo & Pruebas Hurl

Para auditar y verificar el contrato formal (`openapi.yaml`):

```bash
# Ejecutar test de contrato Hurl
hurl --test tests/001_contract.hurl
```

---

## 🔍 CodeGraph (Code Intelligence)

El proyecto cuenta con el índice `.codegraph/` listo para consultas semánticas y análisis de impacto:

```bash
# Explorar símbolos y rutas
codegraph explore "mantenimientos camiones aggregate pipeline"

# Inspeccionar estructura de archivos indexada
codegraph files
```
