# Plan de Migración y Roadmap de Features — QueseProduce (Supabase + Cloudflare)
*Última actualización: 21 jun 2026 (Gantt agrupado + zoom + scroll horizontal/vertical + auto-ancho de labels, todo confirmado funcionando — próximo paso: Ficha de Pieza)*

> Pegá este archivo completo al inicio de futuras conversaciones para dar contexto rápido del estado del proyecto. Mejor aún: decile a Claude que clone `https://github.com/cristobalroman95/queseproduce.git` para que lea el código directo del repo sin gastar contexto pegando `index.html` completo — y si no tiene acceso a red en ese entorno, pegá vos los bloques de código relevantes (login, `multimediaHTML`, sección Contenido Digital, etc.) según lo que se vaya a tocar.

## Cómo arrancar una conversación nueva con este archivo
1. Pegá este `migration.md` completo.
2. Decile a Claude qué parte del código vas a tocar (ej: "vamos a trabajar en Contenido Digital, sección Gantt") y pegá solo esos bloques de `index.html` si Claude no tiene acceso al repo (sin red, o el repo no está montado en su entorno de trabajo).
3. Si es la primera vez en la sesión, pedile que intente `git clone https://github.com/cristobalroman95/queseproduce.git` primero — si tiene red, ahorra tener que pegar código a mano.

## Arquitectura objetivo
- **Frontend:** `index.html` (single-file) servido por Cloudflare Pages, deploy automático desde GitHub.
- **Repo:** `cristobalroman95/queseproduce`, branch `main`.
- **Backend:** Supabase (Postgres + Auth + Storage). Conexión directa navegador → Supabase vía `supabase-js`. No hay Cloudflare Functions/Workers todavía.
- **Seguridad:** depende 100% de RLS, porque la `anon key` queda pública en el código fuente del HTML. Modelo: "confianza básica" — cualquier usuario autenticado (`auth.role() = 'authenticated'`) puede hacer cualquier operación en casi todas las tablas (ver sección RLS más abajo). No hay todavía granularidad de permisos por rol a nivel de base de datos — el control de acceso por rol (`programador`/`productor`/`artista`/`contador`/`tecnico`/`marketing`) vive solo en el frontend (`ROLE_DEFS`), no en RLS.

## Archivos clave del repo
- `index.html` — versión en producción (la que sirve Cloudflare Pages). Tiene el cliente Supabase, login, y todas las tablas migradas (ver tabla de estado abajo).
- `QueseProduce_2026_rediseño_4_3.html` — versión vieja, pre-Supabase (login con PIN). **No se usa en el deploy.** Candidata a borrar o archivar.
- Cliente Supabase: cerca de la línea ~1016 de `index.html` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `const sb = supabase.createClient(...)`).
- `loadShows()`, `saveShow()`, `saveShows()` — núcleo de carga/guardado de shows y sus relacionadas (ficha técnica, roadmap, presupuesto, cierre, invitados).
- `multimediaHTML()`, `renderMediaGrid()`, `savePhotoFile()`, `loadPhotos()` — módulo de fotos de show (Supabase Storage).
- `loadContenido()`, `persistContenido()`, `buildContenido()` — módulo de Contenido Digital.

## Estado por tabla (al 21 jun 2026)

| Tabla | ¿Conectada al front? | Notas |
|---|---|---|
| `perfiles` | ✅ Sí | usada en login: rol, nombre, vencimiento. **Nota:** la sección "Usuarios" del front (`loadUsers()`/`saveUsers()`) todavía usa `localStorage` con PINs — es resabio de la versión vieja, NO está conectada a esta tabla. Pendiente de decidir si se migra o se elimina esa sección vieja. |
| `sesiones` | ✅ Sí (solo insert) | log de logins |
| `shows` | ✅ Sí | `loadShows()` hace `select`, `saveShows()` hace `insert` (nuevos, sin id) + `upsert onConflict:"id"` (existentes). |
| `ficha_tecnica` | ✅ Sí | 1:1 con shows. `upsert onConflict:"show_id"` en cada edición de campo. |
| `roadmap_secciones` + `roadmap_tasks` | ✅ Sí | 1:N. Patrón borrar+reinsertar por show (`persistRoadmap`/`saveRoadmap`, encadenado con `roadmapSaveChain`). |
| `presupuesto_items` | ✅ Sí | 1:N. Mismo patrón borrar+reinsertar (`persistPresupuesto`/`savePresupuesto`/`presupuestoSaveChain`). |
| `cierre_items` | ✅ Sí | 1:N. Mismo patrón (`persistCierre`/`saveCierre`/`cierreSaveChain`). Incluye `es_ingreso` por categoría. |
| `invitados` | ✅ Sí ← migrado recientemente | 1:N. Mismo patrón (`persistInvitados`/`saveInvitados`/`invitadosSaveChain`). Columnas reales: `id, show_id, nombre, rol, estado, pago` (**sin** columna `orden` — el orden se preserva por `order("id")` al leer). `updateGuest`/`addGuest`/`removeGuest`/`forceSyncInvitados` ya llaman a `saveInvitados`+`savePresupuesto`+`saveCierre` (por la sincronización automática invitados→RRHH). **Fix aplicado:** `updateGuest` no re-renderizaba la vista tras editar — se le agregó el bloque de re-render que ya tenían `addGuest`/`removeGuest`. |
| `contenido_digital` | ✅ Sí | `loadContenido()`/`persistContenido()` — patrón borrar+reinsertar. Columnas: `id, nombre, tipo, plataforma, estado, responsable, fecha, show_id, url, notas`. **Pendiente de este plan:** agregar `fecha_inicio` (ver sección Gantt abajo). |
| `media_items` (fotos de show) | ✅ Sí | Supabase Storage, bucket `show-media`. Tabla con `id, show_id, categoria, label, url, storage_path, tipo, created_at`. Categoría editable post-upload (`<select>` sobre la miniatura). **Confirmado por el usuario:** las 4 políticas RLS (SELECT/INSERT/UPDATE/DELETE) funcionan bien. |

**Punto clave:** ya no queda ninguna tabla de datos operativos en `localStorage`, excepto la sección "Usuarios" (PINs), que es un sistema paralelo viejo no conectado a `perfiles`/Supabase Auth.

## Estado de RLS (auditado 21 jun 2026)

Resultado de la auditoría completa vía `pg_policies`:

- **Patrón dominante:** la mayoría de las tablas (`cierre_items`, `contenido_digital`, `ficha_tecnica`, `invitados`, `presets_roadmap`, `presets_secciones`, `presets_tasks`, `presupuesto_items`, `roadmap_secciones`, `roadmap_tasks`, `sesiones`, `shows`) tienen una sola política `auth_all` con `cmd=ALL` y condición `auth.role() = 'authenticated'` — cubre SELECT/INSERT/UPDATE/DELETE de una sola vez. **Sin huecos.**
- **`media_items`:** 4 políticas separadas (Lectura pública = SELECT con `true`; Insert/Update/Delete autenticado). **Sin huecos**, confirmado funcionando en producción.
- **`perfiles`:** `perfiles_select_auth` (SELECT, autenticado) + `perfiles_update_own` (UPDATE solo de su propia fila, `auth.uid() = id`) + `perfiles_programador_all` (ALL, solo si `es_programador()`). Sin política de INSERT para usuarios normales — coherente con que la creación de usuarios la haga un programador, pero la sección "Usuarios" del front sigue sin usar esta tabla (ver nota arriba).
- **`fotos`:** tiene política `auth_all` pero es candidata a tabla huérfana — probablemente resabio de antes de migrar a `media_items`/Storage. Verificar si algún código la sigue usando; si no, archivar/eliminar.
- **Queries útiles para auditar de nuevo en el futuro** (correr en SQL Editor de Supabase):
  ```sql
  -- Ver todas las políticas
  select tablename, policyname, cmd, permissive, qual, with_check
  from pg_policies where schemaname='public' order by tablename, cmd;

  -- Conteo rápido por tabla+operación (buscar ceros)
  select tablename, cmd, count(*) from pg_policies
  where schemaname='public' group by tablename, cmd order by tablename, cmd;

  -- Confirmar que RLS esté habilitado (no solo que existan políticas)
  select relname as tabla, relrowsecurity as rls_activado
  from pg_class where relnamespace='public'::regnamespace and relkind='r'
  order by relname;
  ```

## Patrón de código validado (aplicar a cualquier tabla nueva)
- `load*()` async con `sb.from(tabla).select("*")`, agrupando por `show_id` (o la FK que corresponda) cuando hay relación 1:N.
- **1:1 simple** (ej. `ficha_tecnica`): `upsert(payload, {onConflict:"<columna_fk>"})` en cada edición de campo.
- **1:N con alta/baja de ítems** (ej. `roadmap`, `presupuesto_items`, `cierre_items`, `invitados`, `contenido_digital`): borrar todas las filas del padre y reinsertar desde memoria. Encadenar con un `Promise` chain tipo `xSaveChain` para evitar carreras en ediciones rápidas seguidas.
- **CRÍTICO — no olvidar el re-render tras cada función de edición de campo**, no solo en agregar/eliminar. Bug recurrente detectado y corregido dos veces (`presupuesto_items`→`updatePresupItem`, `cierre_items`→`updateCierreItem`, `invitados`→`updateGuest`). Antes de dar por cerrada una migración nueva, revisar que **todas** las funciones que modifican un campo (no solo add/remove) terminen con el bloque:
  ```javascript
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel){document.getElementById("pnl-tab-body").innerHTML=xHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=xHTML(s,showIdx,false);}
  ```
- Antes de insertar sin `id` en una tabla nueva: `alter table <tabla> alter column id set generated by default;`
- Al crear un show nuevo (`saveShow()`), crear también las filas iniciales en las tablas relacionadas ya migradas que lo requieran (1:1 siempre necesita fila base; 1:N con array vacío no necesita nada).
- Errores: siempre mostrar vía `toast()`, nunca fallar en silencio.
- **Lección de RLS (`media_items`/UPDATE, ahora también relevante para futuras tablas):** un `.update()` o `.delete()` sin política correspondiente en Supabase **no tira error** — devuelve éxito habiendo afectado 0 filas. Para detectar esto, agregar `.select()` al final de la query y revisar si `data` viene vacío cuando debería tener contenido.

## Decisiones pendientes (heredadas, sin resolver)
- ¿Se elimina del todo el sistema viejo de "Usuarios" con PIN (`localStorage`), o se migra a usar `perfiles`/Supabase Auth de verdad?
- Tabla `fotos`: ¿se usa en algún lado? Si no, archivar.
- Mapeo de permisos por rol a nivel de RLS (hoy todo es "cualquier autenticado puede todo" — funciona porque el control real está en el frontend, pero no es defensa en profundidad).

---

## ROADMAP DE FEATURES EN CURSO — Contenido Digital (sesión actual)

Esta sección documenta el plan acordado con el usuario el 21 jun 2026, para retomarlo en otra conversación si se corta el contexto.

### Contexto / objetivo general
El usuario quiere que **Contenido Digital** tenga "presencia" real dentro de la plataforma, a la altura de lo que ya existe para Shows (ficha completa con pestañas, multimedia, progreso). Hoy cada pieza de contenido es solo una fila con 8 campos planos editable vía modal (`openNewContenido`/`openEditContenido`/`saveContenido`). El plan se acordó en 3 bloques (A, B, C); A y B ya están implementados.

### Estado: Vista Gantt — IMPLEMENTADA Y CONFIRMADA (zoom + agrupado por show + scroll funcionando + scrollbars fader + auto-ancho de labels)
Se agregó:
- Columna `fecha_inicio` (date) en `contenido_digital`.
- `loadContenido()` y `persistContenido()` actualizados para leer/escribir `fechaInicio`.
- Campo "Fecha inicio (producción)" en el modal, antes del campo "Fecha objetivo (publicación)" ya existente.
- Nueva opción "Vista timeline (Gantt)" en el `<select id="cd-view-sel">`.
- `cdGanttColor(tipo)`, `buildContenidoGantt(items)` (reescrita para soportar agrupado + zoom), conectada en `buildContenido()` con un `else if(view==='gantt')` que cachea `items` en `_ganttItemsCache` y aplica defaults de zoom según ancho de pantalla la primera vez (`_ganttZoomTouched`).
- Barras horizontales por pieza, coloreadas por tipo, línea de "hoy", fines de semana sombreados, header de meses/días.

### A. Controles de zoom/slider — IMPLEMENTADO
- **Slider horizontal** (`#cd-gantt-controls` → "🔍 Zoom tiempo"): controla `_ganttDayWidth` (rango 6–50px/día) vía `setGanttDayWidth(v)`. Recalcula posiciones llamando de nuevo a `buildContenidoGantt`, no usa `transform:scale()`.
- **Slider vertical** ("↕ Alto filas"): controla `_ganttRowHeight` (rango 26–60px) vía `setGanttRowHeight(v)`, rotado visualmente con CSS (`.gantt-vslider-wrap input[type=range]{transform:rotate(-90deg)}`).
- Defaults responsive: en `window.innerWidth<640` arranca con `dayWidth=16`/`rowHeight=34` (más compacto), salvo que el usuario ya haya tocado un slider en la sesión (`_ganttZoomTouched=true`, evita resetear su ajuste manual).
- Botones "Expandir todo"/"Colapsar todo" (`expandAllGanttGroups`/`collapseAllGanttGroups`).
- **Bug del scroll horizontal — CONFIRMADO RESUELTO (21 jun), causa raíz real encontrada un nivel más arriba de donde se buscó primero:**
  - Primer intento (insuficiente): se agregó `min-width:0` a `#gantt-scroll-col` y `max-width:100%` a `.gantt-wrap`. Necesario pero no alcanzaba — el bug seguía: aparecía un scroll "fantasma" abajo de toda la página que no movía nada, y el contenido se seguía cortando al llegar a las primeras fechas.
  - **Causa raíz real:** `.app{display:flex}` contiene el sidebar (`position:fixed`, por lo tanto fuera del flujo del flex) y `.main`. Al quedar `.main` como único item flex real, por default tiene `min-width:auto` — o sea, no se achica por debajo de lo que pida su contenido. El `<div style="width:${totalWidth}px">` del Gantt (miles de px con zoom alto) empujaba a `.main` a expandirse más allá del viewport, dejando inútil el `max-width:100%` del `.gantt-wrap` (el 100% se calculaba contra un `.main` ya expandido). Como `body{overflow-x:hidden}`, ese excedente quedaba atrapado y se manifestaba como ese scroll fantasma a nivel de documento.
  - **Fix definitivo:** `.main{margin-left:220px;flex:1;min-width:0;}` (una sola propiedad agregada). Con esto `.main` queda acotado al ancho real disponible, el `max-width:100%` del Gantt sí tiene contra qué calcularse, y el `overflow:auto` interno de `#gantt-scroll-col` finalmente se activa de verdad.
  - **Lección reforzada:** en un bug de "contenido ancho no scrollea, empuja el layout en vez de contenerse", no alcanza con poner `min-width:0` en el contenedor de scroll inmediato — hay que revisar **toda la cadena de ancestros flex** hasta ahí. Cualquier ancestro flex sin `min-width:0` rompe la cadena, sin importar cuántos `min-width:0`/`max-width:100%` tengan los descendientes.
- **Scrollbars "fader" (21 jun):** la regla global del sitio (`::-webkit-scrollbar{width:4px;height:4px}`) hacía que el scroll del Gantt fuera casi invisible y muy difícil de agarrar con el mouse. Se agregó CSS scopeado a `.gantt-scroll`/`.gantt-labels` (no afecta el resto del sitio): grosor 20px, thumb violeta (paleta `--p200`/`--p400`/`--p600` para hover/active) con mínimo 64px de largo (así nunca queda una rayita imposible de pinchar aunque el timeline sea muy ancho), track con su propio fondo simulando la ranura de un fader. Fallback con `scrollbar-color`/`scrollbar-width:auto` para Firefox (no soporta grosor en px).
- **Auto-ancho de la columna de labels (21 jun):** la columna de nombres tenía `width:170px` fijo (`120px !important` en mobile) y truncaba con "…" apenas el nombre no entraba. Nueva función `ganttLabelColWidth(visibleRows, rowHeight)`: mide con `canvas.measureText()` (fuente y peso reales) el texto más ancho entre todos los headers de grupo y nombres de pieza visibles, y devuelve ese ancho clampeado entre 150px–360px (110px mínimo en mobile, máximo 42% del ancho de pantalla). Se recalcula en cada `buildContenidoGantt()`, así que reacciona a expandir/colapsar grupos, cambios de alto de fila, etc. Si un nombre es absurdamente largo y excede el máximo, sigue cortando con ellipsis como fallback. Se sacó el `!important` de `.gantt-labels` en mobile porque ya competía con este ancho dinámico.

### B. Agrupar el Gantt por show — IMPLEMENTADO
- Headers de grupo colapsables (🎭 nombre del show + contador de piezas), generados dinámicamente agrupando por `item.showIdx` (o `'sin-show'` si no tiene show vinculado → grupo final "📦 Sin show vinculado").
- Orden de grupos: por fecha del show (`SHOWS[idx].fecha`), con "Sin show vinculado" siempre al final.
- Estado de colapso en `_ganttCollapsed{}` (objeto en memoria, se resetea al recargar la página — no persiste en Supabase ni localStorage, evaluar si vale la pena persistirlo a futuro).
- `toggleGanttGroup(key)` colapsa/expande un grupo individual al hacer clic en su header.
- Las dos columnas (labels a la izquierda, barras a la derecha) scrollean verticalmente sincronizadas vía `syncGanttVertical(source)`.
- **Pendiente, no decidido:** si conviene aplicar el mismo agrupado por show a la vista "Lista" (se mencionó como posible extensión pero no se acordó explícitamente — evaluar cuando se retome si el usuario lo pide).

### C. Pendiente — "Ficha de Pieza" completa (NO implementado aún, es el bloque más grande, próximo paso)
Acordado con el usuario: aplicar a Contenido Digital el mismo patrón de "ficha con pestañas" que ya existe para Shows (`full-detail-overlay` + `fullDetailTab()`). Reemplaza el modal actual como mecanismo principal de edición.

**Pestañas acordadas:**
1. **Info** — los campos actuales (nombre, tipo, plataforma, estado, responsable, fecha inicio, fecha objetivo, show vinculado, URL, notas), pero **edición en vivo campo por campo** (`contenteditable`/`onblur`, mismo patrón que Ficha Técnica de shows), no modal con botón "Guardar".
2. **Multimedia / Referencias** — subir imágenes de referencia, moodboard, capturas, archivo final. Reutilizar toda la infraestructura ya construida para fotos de show (`media_items`, Storage bucket `show-media`, lightbox, categorías editables). Dos caminos posibles a decidir en la próxima sesión:
   - (a) Agregar columna `contenido_id` nullable a `media_items` y usarla en paralelo a `show_id` (una FK u otra, no ambas a la vez).
   - (b) Crear tabla nueva `contenido_media_items` con esquema idéntico pero `contenido_id` en vez de `show_id`.
   - Recomendación tentativa (a confirmar): opción (a) es más simple de mantener (un solo módulo de fotos sirve para ambas entidades), pero requiere ajustar `loadPhotos`/`savePhotoFile`/etc. para que acepten un parámetro de "tipo de entidad" en vez de asumir siempre `show_id`.
3. **Progreso / Bitácora** — checklist de etapas específico de la pieza (ej: Guion → Grabación → Edición → Aprobación → Publicación), con estado por etapa. Reutilizar el patrón de `roadmap_tasks` pero sin el nivel de "secciones" (lista plana, más simple). Tabla nueva sugerida: `contenido_tasks` (`id, contenido_id, orden, etapa, estado, notas`).
4. *(Futuro, no urgente)* **Métricas** — reach/views/likes post-publicación, mencionado como posible extensión a futuro, no priorizado todavía.

**Cambios de flujo de entrada:**
- El modal actual (`cd-modal-overlay`) se mantiene solo para alta rápida inicial (nombre + tipo mínimo).
- Todos los `onclick="openEditContenido(...)"` existentes (cards de Kanban, filas de Lista, barras del Gantt) deben cambiar para abrir la nueva ficha completa en vez de reabrir el modal.
- El botón "Editar pieza" deja de ser necesario como tal, reemplazado por la edición en vivo dentro de la ficha.

**Trabajo técnico estimado para C (a ejecutar cuando se retome):**
- Tabla(s) nueva(s) en Supabase: `contenido_tasks` (siempre) + decisión sobre `media_items`/`contenido_media_items` (ver arriba).
- Nuevo overlay de página completa en el front, calco de `full-detail-overlay`/`fullDetailTab()` pero para piezas de contenido (podría llamarse `cd-full-detail-overlay` + `cdFullDetailTab()`, o reusar el mismo overlay con una bandera de "modo show" vs "modo pieza" — a decidir según cuánto se quiera reusar vs separar).
- Funciones HTML por pestaña (`cdInfoHTML`, `cdMultimediaHTML` o reuso de `multimediaHTML` parametrizado, `cdProgresoHTML`).
- Persistencia: `saveContenidoCampo()` (1:1-like, similar a como se guarda `ficha_tecnica` campo por campo) en vez de depender de `persistContenido()` (que es borrar+reinsertar de TODAS las piezas — no es ideal para guardar un campo individual de una pieza específica; convendría agregar un `update` puntual por `id` en vez de seguir usando el patrón de borrar-todo-y-reinsertar para ediciones de campo único, reservando el borrar+reinsertar solo para el alta/baja de piezas completas).

### Orden de implementación acordado para la próxima sesión
1. ~~Agrupar por show en el Gantt + sliders de zoom horizontal/vertical responsive (bloques A + B juntos)~~ ✅ **Hecho y confirmado (21 jun)** — incluye el fix de causa raíz del scroll horizontal, scrollbars "fader" y auto-ancho de la columna de labels.
2. **← PRÓXIMO PASO** Ficha completa de pieza — pestaña Info con edición en vivo (reemplaza el modal como mecanismo principal).
3. Pestaña Multimedia/Referencias (decidir primero esquema de tabla: (a) o (b) de arriba).
4. Pestaña Progreso/Bitácora (tabla `contenido_tasks` nueva).

---

## Snapshot de funciones clave a tener en cuenta si se retoma esto sin acceso al repo
Si Claude no tiene acceso al repo en la sesión donde se retome esto, las funciones que casi seguro va a necesitar ver pegadas para poder seguir son:
- Todo el bloque `// ── CONTENIDO DIGITAL ──` completo (incluye `loadContenido`, `persistContenido`, `buildContenido`, `buildContenidoGantt`, `cdCardHTML`, el modal HTML `cd-modal-overlay`, y las funciones `openNewContenido`/`openEditContenido`/`saveContenido`).
- El bloque `// ── MULTIMEDIA ──` completo (para reusar como base de la pestaña de Multimedia de piezas).
- `fullDetailTab()` y la estructura de `full-detail-overlay` en el HTML (para calcar el patrón de ficha completa).
- `fullDetailRoadmapHTML()` (para usar como referencia al construir la pestaña de Progreso/Bitácora, que es conceptualmente un roadmap simplificado sin secciones).
