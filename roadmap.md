# QueseProduce — Roadmap de Desarrollo (Pendientes)
*Versión: 2.3 — 22 de junio de 2026*

Este documento lista exclusivamente las **tareas pendientes** y el orden de prioridad para la evolución de la plataforma.
Las bases (CRUD de shows, contenido digital, equipo, finanzas y hoja de ruta) están **completas y en producción**.

---

## 🎯 Objetivo Actual: Completar el Planificador (Planner 5 vistas)
El Planner tiene un selector de vista (📅 Anual / 🗓 Calendario / 📊 Gantt / 🗂 Kanban) con cuatro vistas implementadas. Solo falta Carga de Equipo.

### 📊 Resumen de las 5 Vistas
| Vista | Pregunta que responde | Estado |
|---|---|---|
| 📅 **Anual** (B.1) | ¿Qué hay cada mes a lo largo del año? | ✅ **Completado** (grilla por mes, shows + contenido, filtro por tipo). |
| 🗓 **Calendario** (B.4) | ¿Qué hay el día X exactamente? | ✅ **Completado** (grilla mensual, navegación ← →, chips con tooltip, modal creación con fecha pre-cargada). |
| 📊 **Gantt** (B.3) | ¿Hay choques de fechas? ¿Cómo se distribuye la carga? | ✅ **Completado** (barras unificadas shows + contenido, agrupado por show, zoom, colapsar grupos). Pendiente menor: edición inline por clic en barra. |
| 🗂 **Kanban** (B.2) | ¿En qué etapa está cada cosa? | ✅ **Completado** (toggle Shows/Contenido, columnas por estado, drag & drop con persistencia, respeta `canEdit`). |
| 👥 **Carga de Equipo** (B.5) | ¿Quién está sobrecargado? ¿Quién tiene espacio? | 🔴 **Pendiente (Prioridad 1 - única vista restante)** |

---

## ✅ B.4 — Calendario Mensual (Completado)
### Qué se implementó
- Grilla 7 columnas × N semanas del mes generada dinámicamente.
- Navegación ← → por mes + botón "Hoy" (aparece solo cuando no estás en el mes actual).
- Chips por celda: nombre truncado a 18 chars + ícono de tipo, máx 3 visibles + overflow "+N más".
- `title` nativo con nombre completo + equipo asignado (tooltip de hover).
- Clic en chip show → `goToShow(idx)` / clic en chip contenido → `openCdDetail(id)`.
- Clic en celda vacía → modal de creación con fecha pre-cargada, bifurca entre "Nuevo Show" y "Nueva Pieza".
- Selector de vista en el header del Planner: tabs 📅 Anual / 🗓 Calendario, con estado persistente durante la sesión.

### Archivos modificados
- `js/planner.js` — `groupByWeek()` extraída como función global; nuevas funciones `plSetView`, `_renderPlannerView`, `buildPlannerCalendario`, `calNavTo`, `calNavHoy`, `calCellClick`, `calOpenNewModal`, `calNuevoShow`, `calNuevoContenido`.
- `js/app.js` — `nav()` y `enterApp()` actualizados para llamar `_renderPlannerView()` en lugar de `buildPlanner()` directamente.
- `index.html` — agregado `#pl-view-tabs` con los dos botones de vista.
- `css/app.css` — estilos para `.pl-view-tab`, `.cal-monthly-grid`, `.cal-cell`, `.cal-chip`, `.cal-chip-show`, `.cal-chip-content`, `.cal-chip-more`.

---

## ✅ B.3 — Gantt Unificado (Shows + Contenido) (Completado)
### Qué se implementó
- Tercer tab "📊 Gantt" en `#pl-view-tabs`, con case en `_renderPlannerView()`.
- `buildPlannerGantt()` (nueva, independiente de `buildContenidoGantt()` de Contenido): resuelve un array mixto de shows y contenido.
  - **Shows:** barra puntual de 1 día en su fecha, con color por tipo/estado (`showGanttColor`, mismo criterio que vista Anual).
  - **Contenido:** doble tramo — Preproducción (`fechaIdea→fechaInicio`, rayado) + Producción (`fechaInicio→fecha`, sólido).
- **Agrupación por show:** filas agrupadas bajo su show asociado (`🎭 Nombre show`); grupo separado `📦 Sin show vinculado` para contenido sin `showIdx`. Grupos ordenables, colapsables individualmente y con botones "Expandir todo" / "Colapsar todo".
- **Zoom:** sliders propios del Planner (`_plGanttDayWidth`, `_plGanttRowHeight`), independientes del Gantt de Contenido para no pisar su estado.
- Línea de "hoy", franjas de fin de semana, header con meses + días, ancho de columna de etiquetas autoajustable según el texto más largo.
- Scroll horizontal/vertical sincronizado entre el panel de etiquetas y el de barras (`syncPlGanttVertical`).

### Pendiente (menor)
- **Edición inline por clic en barra:** quedó descartada en favor de navegación directa — el clic en una barra hoy llama a `goToShow()` / `openCdDetail()` (abre el detalle) en lugar de abrir un `input date` inline para editar la fecha sin salir del Gantt. Mover a "Mejoras Transversales" si se retoma.

### Archivos modificados
- `js/planner.js` — nuevas funciones `buildPlannerGantt`, `setPlGanttDayWidth`, `setPlGanttRowHeight`, `togglePlGanttGroup`, `showGanttColor`, `syncPlGanttVertical`; nuevo estado `_plGanttDayWidth`, `_plGanttRowHeight`, `_plGanttZoomTouched`, `_plGanttCollapsed`.
- `index.html` — agregado botón "📊 Gantt" en `#pl-view-tabs`.
- `css/app.css` — estilos para `.gantt-controls`, `.gantt-control-item`, `.gantt-vslider-wrap`, `.gantt-wrap`, `.gantt-labels`, `.gantt-scroll`.

---

## ✅ B.2 — Kanban por Estado (Shows + Contenido) (Completado)
### Qué se implementó
- Cuarto tab "🗂 Kanban" en `#pl-view-tabs`, con case en `_renderPlannerView()`.
- **Decisión de diseño:** se usó la **Opción A** — toggle "🎤 Shows / eventos" / "🎬 Contenido digital" dentro de la vista (`plKanbanSetMode`), ya que ambos tipos tienen vocabularios de estado distintos e incompatibles:
  - Shows: `Tentativo → Confirmado → En proceso → Realizado` (+ `Cancelado`), nueva constante `SHOW_ESTADOS`.
  - Contenido: `Idea → En producción → Listo para publicar → Publicado` (constante `CD_ESTADOS` ya existente, reutilizada).
- **Drag & Drop nativo (HTML5):** tarjetas arrastrables entre columnas (`draggable`, `dragstart`/`dragover`/`drop`). Al soltar, actualiza el estado local al instante (UI optimista) y persiste con `UPDATE` puntual:
  - Shows → `sb.from('shows').update({estado}).eq('id', ...)` (nuevo; antes solo existía el guardado masivo `saveShows()`).
  - Contenido → reutiliza `updateCdField(id,'estado',valor)` ya existente.
  - Si el `UPDATE` falla, revierte el estado local y muestra el error vía `toast`.
- **Cards:** nombre, fecha (`fmtDate`) y avatares del equipo (`equipoStackHTML('show'|'contenido', id, 3)`), mismo patrón que Calendario y Gantt. Clic en la tarjeta abre el detalle (`goToShow` / `openCdDetail`).
- **Permisos:** respeta `ROLE_DEFS[currentUser.rol].canEdit` — si el rol no puede editar (ej. `marketing`), las tarjetas no son arrastrables y las columnas no reciben eventos de drop; solo lectura.
- El filtro "todos/shows/contenido" del Planner (`#pl-filter-tabs`) se oculta en esta vista porque lo reemplaza el toggle interno.

### Archivos modificados
- `js/planner.js` — nuevas funciones `buildPlannerKanban`, `plKanbanSetMode`, `plKanbanShowCard`, `plKanbanContenidoCard`, `plKanbanDragStart/DragEnd/DragOver/DragLeave/Drop`; nuevo estado `SHOW_ESTADOS`, `plKanbanMode`, `_plKanbanDrag`; `plSetView()` actualizado para ocultar `#pl-filter-tabs` en esta vista.
- `index.html` — agregado botón "🗂 Kanban" en `#pl-view-tabs`.
- `css/app.css` — estilos para `.pl-kanban-toggle`, `.pl-kanban-toggle-btn`, `.pl-kanban-cols`, `.pl-kanban-col`, `.pl-kanban-col.drag-over`, `.pl-kanban-card`, `.pl-kanban-card.dragging`.

---

## ⚡ Fase 1: B.5 — Carga de Equipo (Heatmap) — Próximo Paso
### Descripción
Vista de planificación de dotación. Quinto tab en el selector.

### Requisitos Técnicos
1. **Filas:** Personas del equipo (`PERSONAS`).
2. **Columnas:** Semanas o meses.
3. **Celdas:** Cantidad de shows + piezas asignadas a esa persona en ese período.
4. **Color:** Heatmap verde claro → rojo intenso.
5. **Indicador:** Marcar semanas con `viaja: true` en la asignación.

---

## 🔧 Mejoras Transversales (Backlog Técnico)
- **Filtros del Planner:** Añadir filtros por **Estado** (multiselect) y **Rango de Fechas** a todas las vistas (actualmente solo existe filtro por tipo: todos/shows/contenido).
- **Edición inline en Gantt:** Implementar clic en barra → `input date` inline para mover fechas sin abrir el detalle (ver nota en sección B.3).
- **Debt Técnica:** Eliminar `persistContenido()` (marcada como `OBSOLETA` en el código) cuando sea oportuno.
- **Debt Técnica:** `groupItemsByWeek(items, getFecha)` en `planner.js` no tiene ningún llamador (código muerto, quedó de una versión anterior de B.4). Evaluar eliminarla o reaprovecharla; no confundir con `groupByWeek(items)` de `contenido.js`, que sí está en uso.

---

## 📌 Funciones clave del Planner (referencia para próximas vistas)
- `_renderPlannerView()` — dispatcher central; llamar desde `nav()` y cualquier nueva vista.
- `equipoStackHTML(entityType, entityId, max)` — avatares del equipo, disponible en `equipo.js`.
- `goToShow(idx)` / `openCdDetail(id)` — puntos de entrada al detalle desde el Planner.
- `buildPlannerGantt()` — en `planner.js`, Gantt unificado (B.3, completado).
- `buildPlannerKanban()` — en `planner.js`, Kanban unificado (B.2, completado); patrón de toggle Shows/Contenido y de `UPDATE` puntual por `canEdit` reutilizable para Carga de Equipo (B.5).
- `buildContenidoGantt()` — en `contenido.js`, Gantt específico del módulo de Contenido Digital (independiente del Gantt unificado del Planner).
