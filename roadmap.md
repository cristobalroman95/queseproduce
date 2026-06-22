# QueseProduce — Roadmap de Desarrollo (Pendientes)
*Versión: 2.0 — 22 de junio de 2026*

Este documento lista exclusivamente las **tareas pendientes** y el orden de prioridad para la evolución de la plataforma. 
Las bases (CRUD de shows, contenido digital, equipo, finanzas y hoja de ruta) están **completas y en producción**.

---

## 🎯 Objetivo Actual: Completar el Planificador (Planner 5 vistas)
El Planner debe reemplazar la vista simple actual con 5 perspectivas distintas, todas interconectadas. 
Ya tenemos la **Vista Lista** (B.1) implementada y funcionando. 
El siguiente paso es la **Vista Calendario** (B.4).

### 📊 Resumen de las 5 Vistas
| Vista | Pregunta que responde | Estado |
|---|---|---|
| 📋 **Lista** (B.1) | ¿Qué viene ahora, en orden cronológico? | ✅ **Completado** (feed semanal, edición inline de fecha/estado, avatares). |
| 🗺 **Calendario** (B.4) | ¿Qué hay el día X exactamente? | 🔴 **Pendiente (Prioridad 1)** |
| 📊 **Gantt** (B.3) | ¿Hay choques de fechas? ¿Cómo se distribuye la carga? | 🔴 **Pendiente (Prioridad 2)** |
| 🗂 **Kanban** (B.2) | ¿En qué etapa está cada cosa? | 🔴 **Pendiente (Prioridad 3)** |
| 👥 **Carga de Equipo** (B.5) | ¿Quién está sobrecargado? ¿Quién tiene espacio? | ⚪ **Pendiente (Prioridad 4 - No urgente)** |

---

## ⚡ Fase 1: B.4 — Calendario Mensual (Próximo Paso)
### Descripción
Grilla tipo Google Calendar (7 columnas × semanas del mes). Debe mostrar shows y contenido mezclados por día.

### Requisitos Técnicos
1.  **Prerrequisito (Extracción):** Mover la lógica de `groupByWeek` (actualmente dentro de `buildPlanner()` en `planner.js`) a una función global reutilizable en `app.js` o `planner.js`. Esto permitirá agrupar por semanas para otras vistas.
2.  **Vista:**
    *   Grilla con navegación por mes (← →) y botón "Hoy".
    *   Cada celda contiene chips de los ítems de ese día (nombre truncado + ícono de tipo).
    *   **Clic en chip:** Abre `openPanel(idx)` para shows o `openCdDetail(id)` para contenido.
    *   **Clic en celda vacía:** Abre un modal para crear nuevo show/pieza con fecha pre-cargada.
    *   **Tooltip/Hover:** Mostrar el equipo asignado (`equipoStackHTML`) al pasar el mouse sobre el chip.
3.  **UI/UX:** No mostrar avatares dentro de la celda (por espacio); solo en el hover.

---

## ⚡ Fase 2: B.3 — Gantt Unificado (Shows + Contenido)
### Descripción
Extender la vista Gantt actual (que solo muestra contenido) para que también incluya shows.

### Requisitos Técnicos
1.  **Adaptación de datos:** Generalizar `buildContenidoGantt()` para recibir un array mixto de shows y contenido.
    *   **Shows:** Se representan como una barra de 1 día en la fecha del show (o marca puntual).
    *   **Contenido:** Mantiene el doble tramo (Preproducción `fechaIdea→fechaInicio` + Producción `fechaInicio→fecha`).
2.  **Agrupación:** Agrupar por show (para contenido) y tener un grupo separado para shows sin contenido asociado.
3.  **Edición:** Soportar *drag & drop* de barras para modificar fechas (evaluar complejidad; si es muy costoso, implementar solo edición por clic en la barra que abre un input date).
4.  **Zoom:** Reutilizar los sliders horizontales y verticales existentes (`_ganttDayWidth`, `_ganttRowHeight`).

---

## ⚡ Fase 3: B.2 — Kanban por Estado (Shows + Contenido)
### Descripción
Columnas = estados. Debe resolver el desafío de que shows y contenido tienen estados distintos.

### Decisión de Diseño (a definir al implementar)
Opción A: **Toggle** entre "Ver Shows" y "Ver Contenido" (dos modos separados).
Opción B: **Doble fila de columnas** o **columnas divididas** (ej: columna "Confirmado" con una fila de shows y otra de contenido).
Opción C: **Unificar estados** (mapear "Confirmado" → "Listo", "Tentativo" → "Idea", etc.) — *descartada por decisión previa, no mezclar estados.*

### Requisitos Técnicos
1.  **Drag & Drop:** Mover tarjetas entre columnas actualiza el estado en Supabase (`UPDATE` puntual).
2.  **Cards:** Mostrar nombre, fecha y avatares del equipo.
3.  **Clic:** Abre el detalle correspondiente (panel o ficha).

---

## ⚡ Fase 4: B.5 — Carga de Equipo (Heatmap)
### Descripción
Vista de planificación de dotación para evitar sobrecargas.

### Requisitos Técnicos
1.  **Filas:** Personas del equipo (`PERSONAS`).
2.  **Columnas:** Semanas o meses.
3.  **Celdas:** Número de shows + piezas de contenido asignadas a esa persona en ese período.
4.  **Color:** Heatmap (verde claro → rojo intenso) según la cantidad absoluta o relativa.
5.  **Indicador:** Marcar semanas donde `viaja: true` en la asignación.

---

## 🔧 Mejoras Transversales (Backlog Técnico)
*   **Filtros del Planner:** Añadir filtros por **Estado** (multiselect) y **Rango de Fechas** a todas las vistas del Planner (actualmente solo existe filtro por Tipo).
*   **Prerrequisito de Estructura:** Asegurar que `groupByWeek` esté extraída como función independiente antes de implementar B.4 (para no duplicar lógica).
*   **Debt Técnica:** Eliminar `persistContenido()` (obsoleta) del código base cuando sea oportuno.

---

## 📌 Nota sobre el Equipo
La integración del equipo (avatares, `equipoStackHTML`) **ya está funcionando** en Shows, Contenido Digital y en la Vista Lista del Planner. 
Cuando se implementen las nuevas vistas (Calendario, Gantt, Kanban), se debe reutilizar `equipoStackHTML` para mostrar a las personas asignadas (en cards o tooltips).- `function openPanel(idx)` y `function openCdDetail(id)` — puntos de entrada al detalle (clic en fila del Planner).
- `saveCdCampo()` / `saveShows()` — sync Supabase, reutilizados por las funciones de edición inline del Planner.

---

## Contraste planificacion.md vs index.html (22 jun 2026)

### ✅ Coincidencias confirmadas
- **A.1 Dashboard avatares** — `buildDash()` tiene `equipoStackHTML("show",s.id,3)` en columna Equipo. ✓
- **A.2 Contenido Digital avatares** — `cdCardHTML()` y vista lista tienen avatares; `cdInfoHTML()` tiene `equipoAsignadoHTML`. ✓
- **B.1 Planner Lista** — `buildPlanner()` implementa feed semanal con `weekKey`/`weekLabel`, edición inline via `plUpdateShowEst`, `plUpdateShowFecha`, `plUpdateCdEst`, `plUpdateCdFecha`, avatares `equipoStackHTML` en cada fila. ✓
- **Funciones snapshot** — todas las listadas existen en el código: `buildPlanner`, `plUpdateShowEst/Fecha`, `plUpdateCdEst/Fecha`, `buildContenidoGantt`, `equipoStackHTML`, `openPanel`, `openCdDetail`, `saveCdCampo`, `saveShows`. ✓

### ⚠️ Discrepancias menores
- **`groupByWeek`** — el plan la describe como función reutilizable (~línea 4530); en el código está inlined dentro de `buildPlanner()`. No es problema funcional hoy, pero hay que extraerla antes de B.4.
- **Filtros del Planner** — el plan especifica filtros de estado y rango de fechas. El código solo tiene filtro de tipo (`plFilter`: todos/shows/contenido). Pendiente.
- **`persistContenido()`** — el plan dice "reemplazada"; el código la conserva marcada como `OBSOLETA`. Deuda técnica menor.
- **A.3 Planner avatares** — B.1 los tiene. El ítem 7 del orden de implementación lo marca como gradual, lo cual es consistente.

### 🔴 Próximo paso: B.4 Calendario mensual
Lo que el plan pide y el código no tiene aún:
- Grilla 7 columnas × semanas del mes
- Chips de ítems por celda (shows + contenido) con nombre truncado + ícono de tipo
- Navegación ← → por mes + botón "hoy"
- Clic en chip → `openPanel(idx)` / `openCdDetail(id)`
- Tooltips de equipo en hover de chip (no dentro de la celda)
- Clic en celda vacía → modal "nuevo show/pieza en esta fecha"

**Prerrequisito técnico:** extraer la lógica `groupByWeek` de `buildPlanner()` como función independiente, y agregar un cuarto tab en `#pl-filter-tabs` (o selector de vista tipo Contenido Digital) que llame a `buildPlannerCalendario()`. Esta función consumirá la misma data combinada que ya usa `buildPlanner()`.
