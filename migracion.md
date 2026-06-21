# Plan de Migración y Roadmap de Features — QueseProduce (Supabase + Cloudflare)
*Última actualización: 21 jun 2026 — auditoría RLS corrida contra la base real. Migración de datos: completa. Pendiente real: aplicar fix de RLS a 3 tablas sin auth (`personas`, `asignaciones`, `notas_equipo`) y terminar de pasar `persistContenido()` a upsert-por-id en alta/baja.*

> Pegá este archivo completo al inicio de futuras conversaciones para dar contexto rápido del estado del proyecto. Mejor aún: decile a Claude que clone `https://github.com/cristobalroman95/queseproduce.git` y lea el código directo — este documento se desactualiza fácil si se sigue escribiendo a mano sin contrastarlo contra el repo. Hay además un segundo documento, `planificacion.md`, en la raíz del repo, específico de la iniciativa "Equipo en otras áreas + Planner modernizado". Pegalo también si vas a tocar esa parte.

## ⚠️ Nota de corrección (21 jun 2026)
Esta versión se reescribió después de clonar el repo y leer `index.html` directamente, no solo el `migracion.md` anterior. Encontrado:
- El **Bloque C (Ficha de Pieza)** que figuraba como "próximo paso, no implementado" **ya está hecho**, con más alcance del que el plan original describía (5 pestañas, no 3).
- `media_items` ya resolvió la decisión pendiente de esquema (opción **a**: columna `contenido_id`).
- Existe una columna `fecha_idea` en `contenido_digital` (usada para un segmento de "preproducción" en el Gantt) que no estaba documentada.
- El sistema viejo de "Usuarios"/PIN **ya se eliminó** (no es una decisión pendiente, está resuelta).
- Hay un sistema de **Equipo** (`personas`, `asignaciones`) completo y en uso que no estaba mencionado en ninguna versión anterior de este archivo — vive documentado aparte en `planificacion.md`.
- El fix de "guardar campo individual sin borrar toda la tabla" se hizo, pero **solo cubre edición**; alta y baja de piezas de contenido siguen usando borrar+reinsertar completo (impacto real: rompe `asignaciones` de Equipo en esos dos casos puntuales, no en la edición normal).

**Moraleja para vos:** cuando una sesión hace cambios grandes de código, pedile a Claude que después corra `git clone` y confirme contra el `index.html` real antes de dar por buena cualquier actualización de este archivo. Si no tiene red, no hay drama, pero avisalo explícitamente para no asumir que el doc está sincronizado con el código.

---

## Cómo arrancar una conversación nueva con este archivo
1. Pegá este `migracion.md` completo (y `planificacion.md` si vas a tocar Equipo/Planner).
2. Decile a Claude qué parte del código vas a tocar.
3. Si es la primera vez en la sesión, pedile que intente `git clone https://github.com/cristobalroman95/queseproduce.git` primero y que **confirme contra el código** antes de asumir nada de este doc.

## Arquitectura objetivo
- **Frontend:** `index.html` (single-file, ~6200 líneas) servido por Cloudflare Pages, deploy automático desde GitHub.
- **Repo:** `cristobalroman95/queseproduce`, branch `main`. Carpeta `patchs/` guarda los `.patch`/`.diff` de cada paso incremental (útil como historial real cuando `git log` no alcanza, porque el repo se sube con commits squasheados).
- **Backend:** Supabase (Postgres + Auth + Storage). Conexión directa navegador → Supabase vía `supabase-js`. No hay Cloudflare Functions/Workers todavía.
- **Auth:** Google OAuth como único mecanismo (`paso7-google-auth.patch`), con auto-alta de usuarios nuevos vía trigger de Supabase y rol `invitado` por defecto.
- **Seguridad:** depende 100% de RLS, porque la `anon key` queda pública en el código fuente del HTML. Modelo: "confianza básica" — cualquier usuario autenticado (`auth.role() = 'authenticated'`) puede hacer cualquier operación en casi todas las tablas. No hay granularidad de permisos por rol a nivel de base de datos — el control de acceso por rol vive solo en el frontend (`ROLE_DEFS`), no en RLS.

## Archivos clave del repo
- `index.html` — versión en producción.
- `migracion.md` — este archivo.
- `planificacion.md` — plan específico de "Equipo en otras áreas + Planner modernizado" (iniciativa separada, en curso).
- `patchs/` — historial de patches aplicados paso a paso. Nombres relevantes recientes: `paso7-google-auth.patch`, `paso8-equipo-personas.patch`, `paso8b-equipo-fotos-notas.patch`, `paso8c-automatch-email.patch`, `paso9-bitacora-panel-delete.patch` (agrega pestaña Bitácora al detalle de **show**, no confundir con la Bitácora de piezas de Contenido Digital, que es otra cosa), `paso-borrar-usuarios.patch`, `paso-ficha-pieza-info.patch`, `paso-ficha-pieza-v2-pestanas.patch`, `paso-fix-gantt-scroll-horizontal.patch`, `paso-gantt-labels-autowidth.patch`, `fix-updateCdField-update-puntual.patch`.
- `QueseProduce_2026_OLD.html` — versión vieja, pre-Supabase. No se usa en el deploy.
- Cliente Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `const sb = supabase.createClient(...)` cerca de la línea ~1016.
- `loadShows()`, `saveShow()`, `saveShows()` — núcleo de carga/guardado de shows y relacionadas.
- `multimediaHTML()`, `renderMediaGrid()`, `savePhotoFile()`, `loadPhotos()` — módulo de fotos de show (Supabase Storage, bucket `show-media`).
- `loadContenido()`, `persistContenido()`, `buildContenido()`, `buildContenidoGantt()`, `cdDetailTab()` — módulo de Contenido Digital (lista/kanban/gantt + ficha completa).
- `equipoStackHTML()`, `equipoAsignadoHTML()` — módulo de Equipo (avatares + asignación), usado hoy en Shows.

---

## ✅ ESTADO POR TABLA

| Tabla | ¿Conectada? | Notas |
|---|---|---|
| `perfiles` | ✅ Sí | rol, nombre, vencimiento. Auto-alta vía trigger en login con Google. |
| `sesiones` | ✅ Sí (solo insert) | log de logins |
| `shows` | ✅ Sí | `insert` (nuevos) + `upsert onConflict:"id"` (existentes). |
| `ficha_tecnica` | ✅ Sí | 1:1 con shows. `upsert onConflict:"show_id"`. |
| `roadmap_secciones` + `roadmap_tasks` | ✅ Sí | 1:N, patrón borrar+reinsertar por show. |
| `presupuesto_items` | ✅ Sí | 1:N, mismo patrón. |
| `cierre_items` | ✅ Sí | 1:N, mismo patrón. Incluye `es_ingreso` por categoría. |
| `invitados` | ✅ Sí | 1:N. Columnas: `id, show_id, nombre, rol, estado, pago`. Sincroniza automático con `presupuesto_items`/`cierre_items` (RRHH). |
| `contenido_digital` | ✅ Sí | Columnas reales: `id, nombre, tipo, plataforma, estado, responsable, fecha, fecha_inicio, fecha_idea, show_id, url, notas`. **`fecha_idea`** = inicio de preproducción, no estaba documentada antes; junto con `fecha_inicio`/`fecha` arma el Gantt en dos tramos (preproducción + producción). Edición de campo individual: `UPDATE` puntual por `id` (`saveCdCampo`/`updateCdField`). Alta/baja de piezas: sigue siendo borrar+reinsertar de toda la tabla vía `persistContenido()` — ver advertencia en "Decisiones pendientes". |
| `contenido_tasks` | ✅ Sí | Nueva. 1:N con `contenido_digital` vía `contenido_id`. Checklist de etapas (pestaña Progreso de la Ficha de Pieza). Columnas: `id, contenido_id, orden, etapa, estado, notas`. |
| `contenido_logs` | ✅ Sí | Nueva. 1:N con `contenido_digital` vía `contenido_id`. Bitácora de comentarios de la pieza (pestaña Bitácora, **separada** de Progreso). Columnas: `id, contenido_id, autor, texto, created_at`. |
| `contenido_metricas` | ✅ Sí | Nueva. 1:N con `contenido_digital` vía `contenido_id`. Reach/views/likes/comentarios/guardados/shares por plataforma (pestaña Métricas — el plan original la marcaba "futuro, no priorizado" pero ya está construida). |
| `media_items` (fotos, shows y piezas de contenido) | ✅ Sí | Bucket único `show-media` (constante `STORAGE_BUCKET`) reusado para ambas entidades. Columna `contenido_id` (nullable) agregada en paralelo a `show_id` — la decisión de esquema (a) vs (b) quedó resuelta como **(a)**. |
| `personas` | ✅ Sí | Nueva. Equipo de trabajo: nombre, rol, contacto, área, activo/inactivo. Auto-match por email contra `perfiles` (`autoMatchPerfilByContacto`). |
| `asignaciones` | ✅ Sí | Nueva. 1:N, `entity_type` (`'show'` por ahora) + `entity_id` + `persona_id`. Patrón borrar+reinsertar por entidad. **Todavía no se usa con `entity_type='contenido'`** — bloqueado por el patrón borrar-todo de `persistContenido()` en alta/baja (ver `planificacion.md`). |
| `notas_equipo` | ✅ Sí | Nueva, no documentada hasta esta revisión. Bitácora genérica de notas (autor, texto, fecha) por entidad — `entity_type` (`'show'` o `'persona'`) + `entity_id`. Usada en la pestaña "💬 Bitácora" del detalle de show (`fetchNotas`/`addNota`/`deleteNota`) y al borrar una persona del Equipo. Columnas: `id, entity_type, entity_id, autor, texto, created_at`. |

**Punto clave:** no queda ninguna tabla de datos operativos en `localStorage`. El sistema viejo de "Usuarios"/PIN se eliminó por completo (`paso-borrar-usuarios.patch`), no se migró.


## Patrón de código validado (aplicar a cualquier tabla nueva)
- `load*()` async con `sb.from(tabla).select("*")`, agrupando por la FK que corresponda cuando hay relación 1:N.
- **1:1 simple** (ej. `ficha_tecnica`): `upsert(payload, {onConflict:"<columna_fk>"})` en cada edición de campo.
- **1:N con alta/baja de ítems:** borrar todas las filas del padre y reinsertar desde memoria, encadenado con un `Promise` chain tipo `xSaveChain`. **Pero para edición de un campo individual de un ítem ya existente, preferir `UPDATE` puntual por `id`** (patrón confirmado con `contenido_digital`/`saveCdCampo`) — el borrar+reinsertar completo solo tiene sentido para alta/baja real de ítems, no para cada edición de campo, porque hace que los `id` cambien y rompe cualquier FK externa que apunte a esos ids (ej. `asignaciones.entity_id`, `media_items.contenido_id`).
- **CRÍTICO — no olvidar el re-render tras cada función de edición de campo**, no solo en agregar/eliminar:
  ```javascript
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel){document.getElementById("pnl-tab-body").innerHTML=xHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=xHTML(s,showIdx,false);}
  ```
- Antes de insertar sin `id` en una tabla nueva: `alter table <tabla> alter column id set generated by default;`
- Errores: siempre mostrar vía `toast()`, nunca fallar en silencio.
- **Lección RLS:** un `.update()`/`.delete()` sin política correspondiente **no tira error** — devuelve éxito habiendo afectado 0 filas. Agregar `.select()` al final de la query para detectarlo.
- **Lección de layout (Gantt):** si contenido ancho "empuja" el layout en vez de scrollear, revisar **toda la cadena de ancestros flex**, no solo el contenedor inmediato de scroll — un solo ancestro flex sin `min-width:0` (ej. `.main` dentro de `.app{display:flex}`) rompe la cadena entera.

---

## ⏳ DECISIONES Y TAREAS PENDIENTES (vigentes, confirmadas contra el código y la base real)
1. **RLS granular por rol:** hoy todo es "cualquier autenticado puede todo" (más allá del fix del punto 1). Evaluar si vale la pena a futuro — no es urgente, es defensa en profundidad.
2. **`persistContenido()` sigue siendo borrar+reinsertar completo en alta y baja de piezas** (solo la edición de campo ya usa `UPDATE` puntual). Es el bloqueo real para conectar Equipo a Contenido Digital: cualquier alta o baja de una pieza regenera los `id` de **todas** las piezas existentes, dejando huérfanas las filas de `asignaciones` que apuntaban a esos ids. Pasar también alta/baja a upsert-por-id es prerequisito antes de avanzar con Equipo en Contenido Digital (ver `planificacion.md`, Parte A.2).
3. ~~Sistema viejo de "Usuarios"/PIN~~ → **Resuelto: se eliminó** (`paso-borrar-usuarios.patch`).
4. ~~Esquema multimedia para piezas de Contenido~~ → **Resuelto: opción (a)**, columna `contenido_id` en `media_items`.
5. ~~Auditoría RLS de tablas nuevas~~ → **Resuelto, corrida el 21 jun 2026** contra la base real (ver hallazgo del punto 1).

---

## ✅ COMPLETADO — Contenido Digital: Vista Gantt
Columna `fecha_inicio` (producción) + `fecha_idea` (preproducción) en `contenido_digital`. Vista timeline con dos segmentos por pieza: tramo rayado de preproducción (`fecha_idea`→`fecha_inicio`, solo si ambas fechas existen) + tramo sólido de producción (`fecha_inicio`→`fecha`), coloreados por tipo (`cdGanttColor`), línea de "hoy", fines de semana sombreados.

**Zoom:** sliders horizontal (`_ganttDayWidth`, 6–50px/día) y vertical (`_ganttRowHeight`, 26–60px), defaults responsive, expandir/colapsar todo, scroll horizontal arreglado (causa raíz: `.main` sin `min-width:0` en la cadena flex), scrollbars "fader" scopeadas, ancho automático de columna de labels vía `canvas.measureText()`.

**Agrupado:** headers de grupo colapsables por show (🎭 nombre + contador), orden por fecha del show, "📦 Sin show vinculado" al final, scroll vertical sincronizado entre labels y barras.

## ✅ COMPLETADO — Contenido Digital: Ficha de Pieza completa
Reemplazó al modal como mecanismo principal de edición (overlay `cd-full-detail-overlay`, controlador `cdDetailTab()`). El modal (`cd-modal-overlay`, `openNewContenido()`) se mantiene solo para alta rápida inicial. La función vieja `openEditContenido()` quedó como código muerto — no se llama desde ningún lado del HTML; candidata a limpieza si se quiere prolijidad, no es urgente.

**5 pestañas (no 3, como decía el plan original):**
1. **Info** (`cdInfoHTML`) — edición en vivo campo por campo (`onblur`), `UPDATE` puntual vía `CD_FIELD_MAP`/`saveCdCampo`.
2. **Refs / Multimedia** (`cdRefsHTML`) — sube a `media_items` con `contenido_id`, mismo bucket `show-media`. Categorías propias (distintas a las de fotos de show): Moodboard, Brief visual, Guion/Texto, Grabación, Edición, Entrega final, Otros.
3. **Progreso** (`cdProgresoHTML`) — checklist de etapas, tabla `contenido_tasks`.
4. **Bitácora** (`cdBitacoraHTML`) — comentarios con autor/texto/fecha, tabla `contenido_logs`. Es una pestaña aparte de Progreso, no fusionada.
5. **Métricas** (`cdMetricasHTML`) — reach/views/likes/comentarios/guardados/shares por plataforma, tabla `contenido_metricas`. Estaba marcada como "futuro, no priorizado" en el plan original; ya está construida.

---

## 🔜 PRÓXIMO PASO REAL (según `planificacion.md`)
El roadmap de Contenido Digital (A/B/C de este archivo) está cerrado. Lo que sigue activo es la iniciativa de **`planificacion.md`** ("Avatares de Equipo en otras áreas + Planner modernizado"), cuyo primer paso sugerido es:

1. **A.1 — Avatares de Equipo en el Dashboard** (`buildDash()`): agregar columna "Equipo" a la tabla `dash-body`, reusando `equipoStackHTML("show", s.id, 3)` tal como ya existe en la tabla principal de Shows. Sin bloqueos, se puede hacer ahora mismo. **Confirmado pendiente** — `buildDash()` hoy no tiene esa columna.
2. **Prerequisito antes de A.2 (Equipo en Contenido Digital):** terminar de pasar `persistContenido()` a upsert-por-id también en alta/baja (ver Decisión pendiente #4 arriba).
3. Después: A.2 (avatares + bloque "Equipo asignado" en piezas de Contenido), y recién ahí la Parte B (Planner modernizado multi-vista).

Ver `planificacion.md` para el detalle completo de las 5 vistas propuestas del Planner nuevo y las decisiones de diseño a confirmar antes de codear.

---

## Snapshot de funciones clave si se retoma sin acceso al repo
Para seguir con **A.1 (Equipo en Dashboard)**, lo más probable es que haga falta pegar:
- `function buildDash()` completa.
- `equipoStackHTML(entityType, entityId, max)` y `equipoAsignadoHTML(entityType, entityId, canEdit)`.

Para **A.2 / el fix de `persistContenido()`**:
- `function persistContenido()` y `function saveCdCampo()`/`updateCdField()` (para ver el patrón de UPDATE puntual ya usado en edición y replicarlo para alta/baja).
- `function loadAsignaciones()` y el bloque de guardado de `asignaciones` (líneas ~5935 en adelante a la fecha de esta revisión).
