# Planificación — Avatares de Equipo en otras áreas + Planner modernizado
*Creado: 21 jun 2026. Pensado para iterar en otros chats — pegar este archivo completo o pedirle a Claude que clone `https://github.com/cristobalroman95/queseproduce.git` y lo lea directo del repo.*

> Este documento es 100% planificación, todavía no se escribió código de esto. Complementa a `migracion.md` (que trackea el estado de la migración a Supabase) — este archivo es específico de esta iniciativa de "Equipo visible en toda la plataforma + Planner nuevo".

## Contexto (estado real del código al 21 jun 2026)
- **Equipo ya funciona:** tablas `personas` y `asignaciones` en Supabase, con `equipoStackHTML(entityType, entityId, max)` ya implementada y usada hoy en la tabla principal de **Shows** (columna "Equipo" con avatares apilados) y en la pestaña "👥 Equipo" del detalle de cada show.
- **Contenido Digital ya tiene 3 vistas** (`buildContenido()`, selector `cd-view-sel`): **Kanban** (columnas = semanas, vía `groupByWeek()`), **Gantt** (`buildContenidoGantt()`), y **Lista** (tabla). Esto es clave: es el patrón visual/técnico que vamos a reusar y generalizar para el Planner nuevo, en vez de inventar uno desde cero.
- **Planner actual** (`buildPlanner()`): 12 bloques de mes en grilla simple, cada uno lista shows + contenido de ese mes sin estructura de calendario real (no hay celdas por día), filtro básico todos/shows/contenido. Es la pieza más vieja de la plataforma comparada con el resto — confirmado.
- **Dashboard** (`buildDash()`): tarjetas KPI + 2 gráficos de barra (mayormente estáticos) + una tabla "Todos los shows" (`dash-body`) parecida a la tabla principal de Shows, pero sin columna de Equipo todavía.
- **⚠️ Bloqueo técnico activo (ya documentado en `migracion.md` como Paso 9):** `persistContenido()` sigue usando el patrón "borrar TODA la tabla `contenido_digital` + reinsertar TODO" en cada guardado. Esto significa que el `id` de **cualquier** pieza de contenido cambia cada vez que se guarda **cualquier otra** pieza. Mientras esto no se arregle (pasar a upsert-por-id, como ya hace `saveShows()`), **no se puede mostrar de forma confiable el equipo asignado a piezas de Contenido Digital** — los `asignaciones.entity_id` quedarían huérfanos constantemente. Este es el primer paso obligatorio antes de la Parte A.2 más abajo.
- Existe además una sección **"Coordinación de departamentos"** (`buildCoordinacion()`) que ya muestra, por show, un semáforo de avance (ficha técnica / roadmap / presupuesto / contenido). El Planner nuevo **no debe duplicar esto** — Coordinación responde "¿qué tan listo está cada show?"; el Planner debe responder "¿qué está pasando y cuándo, y quién está en cada cosa?".

---

## Parte A — Avatares de Equipo en otras áreas

### A.1 — Dashboard (fácil, sin bloqueos)
Agregar columna "Equipo" en la tabla `dash-body` de `buildDash()`, igual que ya existe en la tabla principal de Shows: `equipoStackHTML("show", s.id, 3)`. Mismo header, misma celda. Reutiliza 100% lo que ya existe — es casi copy-paste del cambio que ya hicimos en la tabla de Shows.

### A.2 — Contenido Digital (bloqueada hasta resolver el Paso 9)
1. **Prerequisito — Paso 9:** reescribir `persistContenido()` para que use `upsert(payload, {onConflict:"id"})` en los items existentes + `insert` sin id en los nuevos (mismo patrón que `saveShows()`), en vez de borrar todo y reinsertar todo. Esto estabiliza los ids de `contenido_digital` para siempre, no solo para Equipo — también beneficia cualquier otra cosa que en el futuro quiera referenciar una pieza de contenido por id (ej. media_items ya lo hace vía `contenido_id`).
2. Una vez estable, agregar a `cdCardHTML(item)`: junto a `👤 ${item.responsable}` (que es un rol/texto libre), sumar `equipoStackHTML("contenido", item.id, 3)` con la gente real asignada.
3. Agregar lo mismo en la vista **Lista** de contenido (una columna "Equipo" en la tabla, igual criterio que Shows/Dashboard).
4. En la vista **Gantt** de contenido (`buildContenidoGantt()`), evaluar si mostrar avatares chiquitos dentro de cada barra o solo en el tooltip/hover (las barras del gantt son angostas, puede no entrar bien — decidir al implementar, no es bloqueante).
5. Conectar por fin el bloque "Equipo asignado" (`equipoAsignadoHTML`) dentro del modal/ficha de pieza de Contenido Digital, igual que ya está en el detalle de show — esto ya estaba planeado desde antes (era el "Paso 10" original) y ahora se hace junto con esto.

### A.3 — Planner nuevo
Una vez construido el Planner (Parte B), todas sus vistas deben mostrar `equipoStackHTML(...)` en cada show/pieza que rendericen — shows ya no tienen bloqueo, contenido depende del Paso 9 igual que en A.2.

---

## Parte B — Planner modernizado, multi-vista

### Objetivo
Una sola fuente de verdad visual para "qué está pasando en la productora y cuándo", combinando **shows** + **piezas de contenido digital**, con la posibilidad de ver "quién está en cada cosa" gracias a Equipo. Cada vista debe aportar una lectura distinta — nada de repetir el mismo dato acomodado distinto.

**Fuentes de datos:** `SHOWS` (campo `fecha`) + `CONTENIDO` (campos `fecha`, `fechaInicio`, `fechaIdea`). **Deliberadamente afuera:** `roadmap_tasks` (son horario del día-del-show, ya tienen su propio tab por show, meterlos aquí sería ruido) y lo que ya cubre Coordinación (% de avance por show).

### Vistas propuestas (4 confirmadas + 1 opcional)

1. **📋 Lista** — feed cronológico agrupado por semana o día (mejora de lo que existe hoy, pero como tabla/feed real, no bloques de mes). Responde: *"¿qué viene ahora, en orden?"* Pensada para revisar rápido al entrar a la app.

2. **🗂 Kanban por estado** — columnas = etapas (`Idea → En producción → Confirmado/Listo → Realizado/Publicado`, unificando los estados de shows y de contenido en una sola escala equivalente). **Importante: NO agrupar por semana como el kanban de Contenido Digital** (sería repetir lo mismo que la Lista) — la columna debe ser la fase/estado, así esta vista responde una pregunta distinta: *"¿en qué etapa está cada cosa?"*, no *"¿cuándo es?"*.

3. **📊 Gantt / Timeline** — barras horizontales por fecha, una fila por show/pieza, mostrando duración cuando aplica (ej. contenido con `fechaInicio`→`fecha`). Responde: *"¿hay choques de fecha? ¿qué semanas están cargadas, cuáles vacías?"*. Reutiliza la lógica de `buildContenidoGantt()` generalizada a ambos tipos de entidad. Opcional dentro de esta vista: overlay fino de "✈️ viajes" (personas con `viaja:true` en ese rango), ya que conecta directo con el trabajo de Equipo.

4. **🗺 Calendario mensual** (grilla tipo Google Calendar, con celdas por día) — la única vista que permite preguntar *"¿qué hay el día 15 de julio?"* directamente. Ninguna de las otras 3 responde bien esa pregunta puntual, por eso vale la pena como cuarta vista en vez de ser redundante.

5. **👥 Carga de equipo (opcional, fase 2)** — filas = personas, columnas = semanas/meses, celdas = cantidad de shows/contenido asignados ese período (heatmap simple), destacando sobrecarga y semanas de viaje. Esta es la única vista pensada *desde* Equipo hacia el calendario (en vez de al revés), útil para planificación de dotación. Se puede dejar para después sin bloquear el resto.

### Filtros transversales (aplican a todas las vistas)
Tipo (shows / contenido / todos), estado, rango de fechas, y — nuevo — filtro por persona ("mostrarme solo lo que tiene asignado a Fulano"), aprovechando `ASIGNACIONES`.

### Base técnica a reusar (no reinventar)
- El selector de vista (`cd-view-sel`) y el patrón de `buildContenido()` como modelo de "una función que decide qué view renderiza".
- `groupByWeek()` generalizada para aceptar shows + contenido mezclados (hoy solo recibe `items` de contenido).
- `buildContenidoGantt()` como base del Gantt unificado.
- `equipoStackHTML()` para los avatares en cualquier vista, una vez resuelto el Paso 9 para el lado de contenido.

---

## Orden de implementación sugerido
1. **A.1** — Avatares en Dashboard (rápido, ningún bloqueo, se puede hacer ahora mismo).
2. **Paso 9** — Fix de `persistContenido()` a upsert-por-id (prerequisito de todo lo demás que toca contenido digital).
3. **A.2** — Avatares + bloque "Equipo asignado" en Contenido Digital (cards, lista, ficha de pieza).
4. **B, vistas 1 y 4** (Lista mejorada + Calendario mensual) — las dos más fundacionales y menos parecidas entre sí.
5. **B, vistas 2 y 3** (Kanban por estado + Gantt unificado).
6. **A.3** — Avatares de equipo dentro del Planner nuevo, en todas sus vistas.
7. *(opcional)* **B, vista 5** — Carga de equipo.

## Decisiones a tomar antes de codear (para resolver en el próximo chat)
- ¿El Planner nuevo **reemplaza** la sección "Planner" actual, o convive como algo nuevo mientras se valida?
- ¿El Kanban agrupa por la escala de estados que propongo arriba, o prefieren otra agrupación?
- ¿Se permite mover/editar fechas directo desde alguna vista del Planner (ej. arrastrar una tarjeta en el Gantt), o por ahora todas las vistas son de solo lectura/navegación (clic → te lleva al show o pieza)?
- ¿La vista "Carga de equipo" se quiere ahora o se posterga sin apuro?
- Confirmar gating de permisos: ¿mismo criterio que el resto (`canEdit` para acciones, lectura abierta a todos los roles con acceso a la sección Planner)?
