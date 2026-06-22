# QueseProduce — Roadmap de Desarrollo (Pendientes)
*Versión: 2.1 — 22 de junio de 2026*

Este documento lista exclusivamente las **tareas pendientes** y el orden de prioridad para la evolución de la plataforma.
Las bases (CRUD de shows, contenido digital, equipo, finanzas y hoja de ruta) están **completas y en producción**.

---

## 🎯 Objetivo Actual: Completar el Planificador (Planner 5 vistas)
El Planner tiene un selector de vista (📅 Anual / 🗓 Calendario) y las primeras dos vistas implementadas.

### 📊 Resumen de las 5 Vistas
| Vista | Pregunta que responde | Estado |
|---|---|---|
| 📅 **Anual** (B.1) | ¿Qué hay cada mes a lo largo del año? | ✅ **Completado** (grilla por mes, shows + contenido, filtro por tipo). |
| 🗓 **Calendario** (B.4) | ¿Qué hay el día X exactamente? | ✅ **Completado** (grilla mensual, navegación ← →, chips con tooltip, modal creación con fecha pre-cargada). |
| 📊 **Gantt** (B.3) | ¿Hay choques de fechas? ¿Cómo se distribuye la carga? | 🔴 **Pendiente (Prioridad 1)** |
| 🗂 **Kanban** (B.2) | ¿En qué etapa está cada cosa? | 🔴 **Pendiente (Prioridad 2)** |
| 👥 **Carga de Equipo** (B.5) | ¿Quién está sobrecargado? ¿Quién tiene espacio? | ⚪ **Pendiente (Prioridad 3 - No urgente)** |

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

## ⚡ Fase 1: B.3 — Gantt Unificado (Shows + Contenido) — Próximo Paso
### Descripción
Extender la vista Gantt actual (que solo muestra contenido) para que también incluya shows, accesible como tercer tab en el selector de vista del Planner.

### Requisitos Técnicos
1. **Adaptación de datos:** Generalizar `buildContenidoGantt()` para recibir un array mixto de shows y contenido.
   - **Shows:** Barra puntual de 1 día en su fecha (con color por tipo/estado, igual que vista Anual).
   - **Contenido:** Mantiene el doble tramo (Preproducción `fechaIdea→fechaInicio` + Producción `fechaInicio→fecha`).
2. **Agrupación:** Agrupar contenido bajo su show asociado; grupo separado "Sin show" para contenido sin `showIdx`.
3. **Edición:** Solo edición por clic en la barra → abre `input date` inline (drag & drop descartado por complejidad).
4. **Zoom:** Reutilizar sliders existentes (`_ganttDayWidth`, `_ganttRowHeight`).
5. **Integración:** Agregar tercer tab "📊 Gantt" al `#pl-view-tabs` en `index.html` y case en `_renderPlannerView()`.

---

## ⚡ Fase 2: B.2 — Kanban por Estado (Shows + Contenido)
### Descripción
Columnas = estados. Cuarto tab en el selector de vista del Planner.

### Decisión de Diseño (pendiente de confirmar al implementar)
- **Opción A (preferida):** Toggle "Ver Shows" / "Ver Contenido" dentro de la vista Kanban.
- **Opción B:** Doble fila de columnas separadas por tipo.
- *Opción C descartada: no mezclar estados entre shows y contenido.*

### Requisitos Técnicos
1. **Drag & Drop:** Mover tarjetas entre columnas → `UPDATE` puntual en Supabase.
2. **Cards:** Nombre, fecha, avatares del equipo (`equipoStackHTML`).
3. **Clic:** Abre detalle correspondiente (`goToShow` / `openCdDetail`).

---

## ⚡ Fase 3: B.5 — Carga de Equipo (Heatmap)
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
- **Debt Técnica:** Eliminar `persistContenido()` (marcada como `OBSOLETA` en el código) cuando sea oportuno.

---

## 📌 Funciones clave del Planner (referencia para próximas vistas)
- `_renderPlannerView()` — dispatcher central; llamar desde `nav()` y cualquier nueva vista.
- `groupByWeek(items, getFecha)` — función global reutilizable para agrupar por semana.
- `equipoStackHTML(entityType, entityId, max)` — avatares del equipo, disponible en `equipo.js`.
- `goToShow(idx)` / `openCdDetail(id)` — puntos de entrada al detalle desde el Planner.
- `buildContenidoGantt()` — en `contenido.js`, base para el Gantt unificado (B.3).
