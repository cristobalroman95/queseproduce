# Planificación — Avatares de Equipo en otras áreas + Planner modernizado
*Última actualización: 22 jun 2026 — decisiones de diseño del Planner cerradas en conversación. Paso 9 (`persistContenido()`) resuelto.*

> Complementa a `migracion.md`. Pegar ambos al inicio de cada sesión que toque estas áreas, o pedir `git clone https://github.com/cristobalroman95/queseproduce.git`.

---

## Contexto (estado real del código al 22 jun 2026)
- **Equipo funciona:** `personas` + `asignaciones` en Supabase. `equipoStackHTML(entityType, entityId, max)` usada en tabla de Shows y pestaña "👥 Equipo" del detalle de show.
- **Contenido Digital tiene 3 vistas:** Kanban (por semana), Gantt, Lista. Base técnica a reutilizar para el Planner.
- **Planner actual (`buildPlanner()`):** 12 bloques de mes, lista shows + contenido sin celdas por día, filtro básico. **Será reemplazado completo** — no convive, el nuevo lo sustituye directo.
- **Dashboard (`buildDash()`):** tabla de shows sin columna Equipo todavía (A.1 pendiente).
- **~~Bloqueo Paso 9~~:** ✅ resuelto (22 jun) — `persistContenido()` reemplazada por `insertCdItem()`/`deleteCdItem()`. Los ids de `contenido_digital` ya son estables. A.2 desbloqueada.

---

## Decisiones de diseño cerradas (22 jun 2026)

| Pregunta | Decisión |
|---|---|
| ¿El Planner nuevo reemplaza o convive con el actual? | **Reemplaza directo.** El actual desaparece. |
| ¿Cuántas vistas? | **Las 5** — cada una debe aportar una lectura distinta, sin redundancia. |
| ¿Estados unificados shows + contenido? | **No.** Cada entidad mantiene sus estados propios. La división shows/contenido se hace con **filtro y color**, no colapsando los estados en una escala común. En el Kanban, una columna puede mostrar chips de ambos tipos con su estado original, distinguibles visualmente. |
| ¿El Planner permite editar? | **Sí.** Desde el Planner se puede editar (al menos fechas y estado) con sincronización completa. La intención es poder sentarse a planificar mirando el Planner y acomodar todo desde ahí. |
| ¿Filtro por persona? | Sí, pero no prioritario. Lo que sí es necesario: **ver quién está en cada cosa** desde cualquier vista (avatares `equipoStackHTML`), sin necesidad de filtrar. El filtro "mostrar solo lo de Fulano" puede llegar después. |
| ¿Vista Carga de equipo (B.5)? | Sí, se quiere, pero **no urgente** — se implementa última. |

---

## Parte A — Avatares de Equipo en otras áreas

### A.1 — Dashboard (sin bloqueos, hacer primero)
Agregar columna "Equipo" en la tabla `dash-body` de `buildDash()`.
- Agregar `<th>Equipo</th>` en el header de la tabla del dashboard (línea ~682 del HTML actual).
- En cada fila de `buildDash()`: agregar `<td>${equipoStackHTML("show", s.id, 3)}</td>`.
- Es copy-paste casi literal de la columna que ya existe en la tabla principal de Shows (línea ~1926).
- **Sin bloqueos, 5 minutos de código.**

### A.2 — Contenido Digital (desbloqueada tras Paso 9)
1. Agregar `equipoStackHTML("contenido", item.id, 3)` en `cdCardHTML(item)` (Kanban), en la vista Lista (nueva columna), y en el header de la Ficha de Pieza.
2. Agregar bloque `equipoAsignadoHTML("contenido", item.id, canEdit)` en la Ficha de Pieza (pestaña Info o sección aparte dentro de ella — decidir al implementar).
3. En el Gantt de contenido: mostrar avatares en hover/tooltip, no dentro de la barra (las barras son angostas).

### A.3 — Planner nuevo
Todas las vistas del Planner muestran `equipoStackHTML(...)` en cada card/fila de show o pieza. Se implementa junto con cada vista de la Parte B.

---

## Parte B — Planner modernizado, 5 vistas

### Principio de diseño
Cada vista responde una pregunta distinta. Si dos vistas responden lo mismo, una sobra.

| Vista | Pregunta que responde |
|---|---|
| 📋 Lista | ¿Qué viene ahora, en orden cronológico? |
| 🗂 Kanban | ¿En qué etapa está cada cosa? |
| 📊 Gantt | ¿Hay choques de fecha? ¿Qué semanas están cargadas? |
| 🗺 Calendario | ¿Qué hay el día X exactamente? |
| 👥 Carga de equipo | ¿Quién está sobrecargado? ¿Quién tiene espacio? |

### Filtros transversales (aplican a todas las vistas)
- **Tipo:** Shows / Contenido / Todos (selector, igual al de Contenido Digital hoy).
- **Estado:** multiselect de estados (los de shows + los de contenido, sin mezclar).
- **Rango de fechas:** desde/hasta (por defecto: mes actual ± N semanas según la vista).
- **Persona:** filtro opcional "mostrar solo lo de Fulano" — baja prioridad, se agrega después sin bloquear el resto.

### Estados y colores
- **Shows:** Confirmado (verde), Tentativo (amarillo), En proceso (azul), Realizado (gris), Cancelado (rojo). Usar la paleta existente (`estC()`/`showColor()`).
- **Contenido:** Idea (gris), En producción (azul), Listo para publicar (naranja), Publicado (verde). Usar `cdEstClass()`/`cdEstEmoji()`.
- Distinguir shows de contenido: además del estado, usar un ícono o borde consistente en todas las vistas (ej. 🎤 shows, 🎬 contenido — ya se usa en el Planner actual, mantener).

### Edición desde el Planner
- Clic en un show → abre el panel lateral existente (`openPanel(idx)`) o navega al detalle. No reinventar.
- Clic en una pieza de contenido → abre la Ficha de Pieza (`openCdDetail(id)`). Ídem.
- **Edición inline de fecha/estado** directamente en el Planner (sin abrir el detalle): al menos en las vistas Lista y Kanban. En Gantt, drag de la barra para mover fecha es deseable pero se evalúa al implementar (puede ser complejo). En Calendario, clic en una celda vacía podría abrir modal de "nuevo show/pieza en esta fecha".
- Toda edición inline sincroniza con Supabase igual que lo hace `saveCdCampo()`/`saveShows()`.

---

### B.1 — 📋 Lista
Feed cronológico de shows + contenido ordenado por fecha, agrupado por **semana** (o por **día** si el rango es corto — evaluar al implementar). Mejora directa del Planner actual.

**Diferencia clave con el Kanban:** aquí la dimensión principal es *cuándo*, no *en qué estado*.

- Cada ítem muestra: fecha, nombre, tipo (ícono), estado (pill), equipo (avatares `equipoStackHTML`).
- Edición inline de estado (select) y fecha (input date) en cada fila — sincroniza inmediato.
- Filtros: tipo + estado + rango de fechas.
- Base técnica: `groupByWeek()` generalizada para recibir shows + contenido mezclados.

### B.2 — 🗂 Kanban por estado
Columnas = estados. **No** por semana (eso ya lo hace el Kanban de Contenido Digital).

**Desafío de diseño:** shows y contenido tienen estados distintos y no mapean 1:1. Solución acordada: mostrar **dos filas de columnas** o un **toggle shows/contenido**, manteniendo los estados originales de cada entidad. Alternativa más simple: cuando el filtro es "Todos", mostrar ambos tipos dentro de cada columna con separación visual (header de grupo o color de borde). Decidir al implementar cuál se ve mejor.

- Cada card muestra: nombre, fecha, equipo (avatares).
- Drag & drop entre columnas cambia el estado del ítem + sincroniza con Supabase.
- Clic en la card abre el detalle (panel/ficha según tipo).

### B.3 — 📊 Gantt / Timeline
Barras horizontales por fecha. Una fila por show o pieza de contenido.

- **Shows:** barra puntual en la fecha del show (o barra corta de 1 día, ya que no tienen duración).
- **Contenido:** dos tramos como en el Gantt actual de Contenido Digital — rayado de preproducción (`fechaIdea`→`fechaInicio`) + sólido de producción (`fechaInicio`→`fecha`).
- Línea de "hoy", fines de semana sombreados — reutilizar CSS del Gantt actual.
- Equipo: avatares en tooltip/hover de cada barra (no dentro de la barra).
- Zoom horizontal con slider (reutilizar `_ganttDayWidth`).
- Edición: drag de barra para mover fecha (evaluar complejidad — si es muy costoso, dejar para v2 y poner solo edición por clic).
- Base técnica: `buildContenidoGantt()` generalizada para recibir también shows.

### B.4 — 🗺 Calendario mensual
Grilla tipo Google Calendar: 7 columnas (días de la semana), filas = semanas del mes, celdas = día concreto.

**Diferencia clave con la Lista:** responde "¿qué hay el día 15?" directamente. Las otras vistas no permiten esa lectura rápida por día puntual.

- Cada celda muestra los ítems de ese día como chips (nombre truncado + ícono de tipo).
- Clic en chip → abre detalle. Clic en celda vacía → abre modal "nuevo show/pieza en esta fecha".
- Navegación por mes (← →) + botón "hoy".
- No mostrar equipo dentro de la celda (muy poco espacio) — sí en el tooltip/hover del chip.
- Es la vista más "cara" de implementar de las 4 no-opcionales. Implementar después de Lista y Gantt.

### B.5 — 👥 Carga de equipo *(no urgente, implementar último)*
Filas = personas del equipo, columnas = semanas/meses.
Cada celda = cantidad de shows + piezas de contenido asignadas a esa persona ese período.
Color de celda = heatmap (verde → amarillo → rojo según carga).
Señalar semanas de viaje (`viaja:true` en `asignaciones`).

**Fuente de datos:** `ASIGNACIONES` cruzado con `SHOWS`/`CONTENIDO` por fecha.
**Utilidad:** planificación de dotación — ver quién tiene espacio antes de asignar algo nuevo.

---

## Orden de implementación definitivo

1. **A.1** — Avatares en Dashboard. *(Hacer ahora, 5 min, sin bloqueos.)*
2. **A.2** — Avatares + Equipo asignado en Contenido Digital (cards, lista, ficha).
3. **B.1** — Planner: vista Lista (reemplaza el actual, más simple de las 5).
4. **B.4** — Planner: Calendario mensual (más útil del día a día junto con Lista).
5. **B.3** — Planner: Gantt unificado shows + contenido.
6. **B.2** — Planner: Kanban por estado (resolver diseño de estados mixtos al implementar).
7. **A.3** — Avatares de equipo dentro del Planner (se va haciendo en paralelo con cada vista de B).
8. **B.5** — Carga de equipo. *(Dejar para el final, no urgente.)*

---

## Snapshot de funciones clave para cuando se retome sin acceso al repo

**Para A.1:**
- `function buildDash()` (~línea 1942) — agregar `<th>Equipo</th>` en el header y `equipoStackHTML("show", s.id, 3)` en cada fila.

**Para A.2:**
- `function cdCardHTML(item)` — agregar `equipoStackHTML("contenido", item.id, 3)`.
- `function cdDetailTab()` / `cdInfoHTML()` — agregar `equipoAsignadoHTML("contenido", item.id, canEdit)`.

**Para Parte B:**
- `function buildPlanner()` (~línea 2968) — será reemplazada completa.
- `function buildContenidoGantt()` — base del Gantt unificado.
- `function groupByWeek(items)` — generalizar para aceptar shows + contenido.
- `equipoStackHTML(entityType, entityId, max)` (~línea 5822) — usar en todas las vistas.
- `function openPanel(idx)` y `function openCdDetail(id)` — los dos puntos de entrada al detalle desde el Planner.
- `saveCdCampo()` / `saveShows()` — patrones de guardado puntual a reutilizar para edición inline.
