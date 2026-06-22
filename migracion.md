# Plan de Migración y Roadmap de Features — QueseProduce (Supabase + Cloudflare)
*Última actualización: 22 jun 2026 — fix `persistContenido()`: alta y baja de piezas pasan a operaciones puntuales (`insertCdItem`/`deleteCdItem`). Patch: `paso-fix-persistcontenido-puntual.patch`.*

> Pegá este archivo completo al inicio de futuras conversaciones para dar contexto rápido del estado del proyecto. Mejor aún: decile a Claude que clone `https://github.com/cristobalroman95/queseproduce.git` y lea el código directo — este documento se desactualiza fácil si se sigue escribiendo a mano sin contrastarlo contra el repo. Hay además un segundo documento, `planificacion.md`, en la raíz del repo, específico de la iniciativa "Equipo en otras áreas + Planner modernizado". Pegalo también si vas a tocar esa parte.

## ⚠️ Nota de corrección (21 jun 2026)
Esta versión se reescribió después de clonar el repo y leer `index.html` directamente, no solo el `migracion.md` anterior. Encontrado:
- El **Bloque C (Ficha de Pieza)** que figuraba como "próximo paso, no implementado" **ya está hecho**, con más alcance del que el plan original describía (5 pestañas, no 3).
- `media_items` ya resolvió la decisión pendiente de esquema (opción **a**: columna `contenido_id`).
- Existe una columna `fecha_idea` en `contenido_digital` (usada para un segmento de "preproducción" en el Gantt) que no estaba documentada.
- El sistema viejo de "Usuarios"/PIN **ya se eliminó** (no es una decisión pendiente, está resuelta).
- Hay un sistema de **Equipo** (`personas`, `asignaciones`) completo y en uso que no estaba mencionado en ninguna versión anterior de este archivo — vive documentado aparte en `planificacion.md`.
- El fix de "guardar campo individual sin borrar toda la tabla" se hizo, pero **solo cubría edición**; alta y baja de piezas de contenido seguían usando borrar+reinsertar completo. **Resuelto el 22 jun** (ver más abajo).

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
- `patchs/` — historial de patches aplicados paso a paso. Nombres relevantes recientes: `paso7-google-auth.patch`, `paso8-equipo-personas.patch`, `paso8b-equipo-fotos-notas.patch`, `paso8c-automatch-email.patch`, `paso9-bitacora-panel-delete.patch`, `paso-borrar-usuarios.patch`, `paso-ficha-pieza-info.patch`, `paso-ficha-pieza-v2-pestanas.patch`, `paso-fix-gantt-scroll-horizontal.patch`, `paso-gantt-labels-autowidth.patch`, `fix-updateCdField-update-puntual.patch`, **`paso-fix-persistcontenido-puntual.patch`** ← nuevo (22 jun).
- `QueseProduce_2026_OLD.html` — versión vieja, pre-Supabase. No se usa en el deploy.
- Cliente Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `const sb = supabase.createClient(...)` cerca de la línea ~1016.
- `loadShows()`, `saveShow()`, `saveShows()` — núcleo de carga/guardado de shows y relacionadas.
- `multimediaHTML()`, `renderMediaGrid()`, `savePhotoFile()`, `loadPhotos()` — módulo de fotos de show (Supabase Storage, bucket `show-media`).
- `loadContenido()`, `insertCdItem()`, `deleteCdItem()`, `buildContenido()`, `buildContenidoGantt()`, `cdDetailTab()` — módulo de Contenido Digital (lista/kanban/gantt + ficha completa). **`persistContenido()` quedó obsoleta** — solo se conserva como herramienta de emergencia, no se llama desde el flujo normal.
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
| `contenido_digital` | ✅ Sí | Columnas reales: `id, nombre, tipo, plataforma, estado, responsable, fecha, fecha_inicio, fecha_idea, show_id, url, notas`. **`fecha_idea`** = inicio de preproducción; junto con `fecha_inicio`/`fecha` arma el Gantt en dos tramos. Edición de campo individual: `UPDATE` puntual por `id` (`saveCdCampo`/`updateCdField`). **Alta: `insertCdItem()` — INSERT puntual, devuelve el id real de Supabase, no toca ids existentes. Baja: `deleteCdItem()` — DELETE puntual por id. `persistContenido()` obsoleta, conservada solo como emergencia.** |
| `contenido_tasks` | ✅ Sí | 1:N con `contenido_digital` vía `contenido_id`. Checklist de etapas (pestaña Progreso). Columnas: `id, contenido_id, orden, etapa, estado, notas`. |
| `contenido_logs` | ✅ Sí | 1:N con `contenido_digital` vía `contenido_id`. Bitácora de comentarios (pestaña Bitácora). Columnas: `id, contenido_id, autor, texto, created_at`. |
| `contenido_metricas` | ✅ Sí | 1:N con `contenido_digital` vía `contenido_id`. Reach/views/likes/comentarios/guardados/shares (pestaña Métricas). |
| `media_items` (fotos, shows y piezas de contenido) | ✅ Sí | Bucket único `show-media`. Columna `contenido_id` (nullable) en paralelo a `show_id` — decisión de esquema resuelta como opción (a). |
| `personas` | ✅ Sí | Equipo de trabajo: nombre, rol, contacto, área, activo/inactivo. Auto-match por email contra `perfiles` (`autoMatchPerfilByContacto`). |
| `asignaciones` | ✅ Sí | 1:N, `entity_type` (`'show'` por ahora) + `entity_id` + `persona_id`. Patrón borrar+reinsertar por entidad. **Ya no está bloqueado por `persistContenido()`** — el fix del 22 jun eliminó el riesgo de ids huérfanos en alta/baja de piezas. Conectar Equipo a Contenido Digital (`entity_type='contenido'`) ya no tiene bloqueo técnico por este lado. |
| `notas_equipo` | ✅ Sí | Bitácora genérica de notas por entidad — `entity_type` (`'show'` o `'persona'`) + `entity_id`. Columnas: `id, entity_type, entity_id, autor, texto, created_at`. |

**Punto clave:** no queda ninguna tabla de datos operativos en `localStorage`. El sistema viejo de "Usuarios"/PIN se eliminó por completo.

---

## Patrón de código validado (aplicar a cualquier tabla nueva)
- `load*()` async con `sb.from(tabla).select("*")`, agrupando por la FK que corresponda cuando hay relación 1:N.
- **1:1 simple** (ej. `ficha_tecnica`): `upsert(payload, {onConflict:"<columna_fk>"})` en cada edición de campo.
- **1:N — edición de campo individual:** `UPDATE` puntual por `id` (patrón `saveCdCampo`/`updateCdField`).
- **1:N — alta de ítem nuevo:** `INSERT` puntual de la sola fila nueva + capturar el `id` devuelto por Supabase (patrón `insertCdItem`). No borrar ni tocar los ítems existentes.
- **1:N — baja de ítem:** `DELETE` puntual por `id` (patrón `deleteCdItem`). No borrar ni tocar los demás ítems.
- **1:N con alta/baja de ítems donde ningún ítem tiene FK externas apuntándole** (ej. `roadmap_tasks`, `presupuesto_items`): el patrón borrar+reinsertar completo sigue siendo aceptable ahí porque no hay FKs que se rompan.
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

1. **RLS granular por rol:** hoy todo es "cualquier autenticado puede todo". Evaluar si vale la pena a futuro — no es urgente, es defensa en profundidad.
2. ~~**`persistContenido()` en alta y baja**~~ → **✅ Resuelto (22 jun)** — `insertCdItem()` (alta puntual) y `deleteCdItem()` (baja puntual) reemplazan el borrar+reinsertar completo. `persistContenido()` conservada como emergencia pero no se llama desde el flujo normal. Ver `paso-fix-persistcontenido-puntual.patch`.
3. ~~Sistema viejo de "Usuarios"/PIN~~ → **Resuelto: se eliminó** (`paso-borrar-usuarios.patch`).
4. ~~Esquema multimedia para piezas de Contenido~~ → **Resuelto: opción (a)**, columna `contenido_id` en `media_items`.
5. ~~Auditoría RLS de tablas nuevas~~ → **Resuelto, corrida el 21 jun 2026** contra la base real.

---

## ✅ COMPLETADO — Contenido Digital: Vista Gantt
Columna `fecha_inicio` (producción) + `fecha_idea` (preproducción) en `contenido_digital`. Vista timeline con dos segmentos por pieza: tramo rayado de preproducción (`fecha_idea`→`fecha_inicio`, solo si ambas fechas existen) + tramo sólido de producción (`fecha_inicio`→`fecha`), coloreados por tipo (`cdGanttColor`), línea de "hoy", fines de semana sombreados.

**Zoom:** sliders horizontal (`_ganttDayWidth`, 6–50px/día) y vertical (`_ganttRowHeight`, 26–60px), defaults responsive, expandir/colapsar todo, scroll horizontal arreglado (causa raíz: `.main` sin `min-width:0` en la cadena flex), scrollbars "fader" scopeadas, ancho automático de columna de labels vía `canvas.measureText()`.

**Agrupado:** headers de grupo colapsables por show (🎭 nombre + contador), orden por fecha del show, "📦 Sin show vinculado" al final, scroll vertical sincronizado entre labels y barras.

## ✅ COMPLETADO — Contenido Digital: Ficha de Pieza completa
Overlay `cd-full-detail-overlay`, controlador `cdDetailTab()`. El modal (`cd-modal-overlay`, `openNewContenido()`) se mantiene solo para alta rápida inicial.

**5 pestañas:**
1. **Info** (`cdInfoHTML`) — edición en vivo campo por campo (`onblur`), `UPDATE` puntual vía `CD_FIELD_MAP`/`saveCdCampo`.
2. **Refs / Multimedia** (`cdRefsHTML`) — sube a `media_items` con `contenido_id`, bucket `show-media`.
3. **Progreso** (`cdProgresoHTML`) — checklist de etapas, tabla `contenido_tasks`.
4. **Bitácora** (`cdBitacoraHTML`) — comentarios con autor/texto/fecha, tabla `contenido_logs`.
5. **Métricas** (`cdMetricasHTML`) — reach/views/likes/comentarios/guardados/shares, tabla `contenido_metricas`.

## ✅ COMPLETADO — Fix `persistContenido()` (22 jun 2026)
Alta y baja de piezas de contenido ahora usan operaciones puntuales en lugar de borrar+reinsertar toda la tabla:

- **`insertCdItem(item)`** — INSERT de la pieza nueva sola, captura y devuelve el `id` real generado por Supabase. Los ids de las piezas existentes no se tocan → `asignaciones`, `contenido_tasks`, `contenido_logs`, `contenido_metricas` y `media_items` no quedan huérfanas.
- **`deleteCdItem(id)`** — DELETE puntual por `id` de la pieza eliminada sola.
- **`saveContenido()`** (el handler del modal) y **`deleteCd()`** / **`deleteCdFromDetail()`** usan las nuevas funciones.
- **`persistContenido()`** se conserva en el código marcada como obsoleta/emergencia. `saveContenidoData()` eliminada.
- **Efecto en Equipo:** el bloqueo técnico que impedía conectar `asignaciones` a `contenido_digital` (porque cualquier alta/baja regeneraba todos los ids) ya no existe. Conectar Equipo a Contenido Digital puede avanzar.

---

## 🔜 PRÓXIMO PASO REAL (según `planificacion.md`)

1. **A.1 — Avatares de Equipo en el Dashboard** (`buildDash()`): agregar columna "Equipo" a la tabla `dash-body`, reusando `equipoStackHTML("show", s.id, 3)` tal como ya existe en la tabla principal de Shows. Sin bloqueos, se puede hacer ahora mismo. **Confirmado pendiente** — `buildDash()` hoy no tiene esa columna.
2. **A.2 — Equipo en Contenido Digital:** ya sin bloqueo técnico tras el fix del 22 jun. Agregar avatares + bloque "Equipo asignado" en la Ficha de Pieza, usando `entity_type='contenido'` en `asignaciones`.
3. Después: Parte B (Planner modernizado multi-vista).

Ver `planificacion.md` para el detalle completo de las 5 vistas propuestas del Planner nuevo y las decisiones de diseño a confirmar antes de codear.

---

## Snapshot de funciones clave si se retoma sin acceso al repo
Para seguir con **A.1 (Equipo en Dashboard)**:
- `function buildDash()` completa.
- `equipoStackHTML(entityType, entityId, max)` y `equipoAsignadoHTML(entityType, entityId, canEdit)`.

Para **A.2 (Equipo en Contenido Digital)**:
- `function loadAsignaciones()` y el bloque de guardado de `asignaciones`.
- `cdDetailTab()` y `cdInfoHTML()` (para ver dónde enchufar el bloque de equipo en la Ficha de Pieza).

Para entender el patrón de persistencia actual de Contenido:
- `insertCdItem()`, `deleteCdItem()`, `saveCdCampo()` — las tres funciones de escritura puntual a BD.
