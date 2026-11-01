# DESIGN.md · Fleet & Logistics Tracker

> **Gobernanza de Diseño Impeccable (Modo: Operate)**  
> *Última actualización: Noviembre 2026 · Spec & Quality Gate*

---

## 1. Visión y Modo de Superficie

* **Modo:** `Operate` (La prioridad absoluta es la velocidad de lectura, escaneo de datos tabulares, alta densidad de información y cero distracción ornamental).
* **Voz de Marca:** Logística pesada, control de tráfico, despacho de transporte e ingeniería mecánica preventiva.
* **Prohibición de "AI Slop":**
  * Cero degradados púrpura/cian o violetas de fantasía (`#d2a8ff`).
  * Cero "cards dentro de cards": la separación de áreas se realiza mediante espaciado de tensión y líneas divisorias sutiles.
  * Cero glifos emoji como decoración superflua en títulos o métricas.
  * Cero contrastes ilegibles en hover (mínimo WCAG AA 4.5:1 estricto).

---

## 2. Paleta Cromática (Industrial & Signal Colors)

| Token | Hex | Rol / Uso Semántico |
|---|---|---|
| `--surface-canvas` | `#0b0e14` | Fondo general de la consola de operaciones. |
| `--surface-panel` | `#111620` | Paneles estructurados de trabajo y tablas. |
| `--border-subtle` | `#1e2638` | Divisores y grillas de datos (1px sólido). |
| `--border-focus` | `#388bfd` | Indicador de foco accesible en teclado y selección. |
| `--text-primary` | `#f0f3f6` | Texto de lectura principal (alto contraste). |
| `--text-muted` | `#7d8590` | Labels, encabezados secundarios y unidades métricas. |
| `--amber-signal` | `#d29922` | Señal de alerta, mantenimiento y precaución vial. |
| `--green-signal` | `#238636` | Disponibilidad de unidades, choferes y viajes despachados. |
| `--blue-route` | `#2f81f7` | Unidades en tránsito activo y rutas asignadas. |
| `--red-danger` | `#da3633` | Baja de unidades y errores críticos del sistema. |

---

## 3. Tipografía y Datos Numéricos

* **Fuente de Lectura e Interfaz:** `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`.
* **Datos Métricos, Odometría y Patentes:** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace` con `font-feature-settings: "tnum" 1` (números tabulares con ancho monoespaciado para que las columnas no bailen al cambiar de cifras).
* **Escala de Espaciado (Tensión de Múltiplos de 4px):**
  * `4px` (micro-ajustes de tags y badges).
  * `8px` (gaps de formularios y botones secundarios).
  * `16px` (padding interno de paneles y tablas).
  * `24px` (separación entre secciones operativas).

---

## 4. Reglas de Componentes

1. **Barra Ejecutiva (Kpi Ribbon):** En lugar de cuatro tarjetas flotantes desconectadas, las métricas operativas conforman una cinta de indicadores compacta y calibrada.
2. **Tablas de Datos Densas:**
   * Encabezados en mayúsculas sutiles (`font-size: 11px`, `letter-spacing: 0.5px`).
   * Filas con hover en `--surface-panel` que no desplazan el layout.
   * Miniaturas fotográficas cuadradas con esquinas de 4px para conservar la silueta del vehículo o el rostro del chofer.
3. **Acciones Operativas:** Botones de texto conciso con verbos directos (`Despachar`, `Asentar Mantenimiento`, `Actualizar Odómetro`).
