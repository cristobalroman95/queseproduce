# QueseProduce — Arquitectura y Convenciones Técnicas
*Versión: 1.1 — 22 de junio de 2026*

## 1. Visión General
QueseProduce es una **aplicación de página única (SPA)** para la gestión integral de producción de shows en vivo. Su objetivo es centralizar la planificación, el presupuesto, el equipo y el contenido digital de una temporada de eventos.

## 2. Stack Tecnológico
| Capa | Tecnología | Notas |
|---|---|---|
| **Frontend** | HTML5 + CSS3 + JavaScript (Vanilla) | Sin frameworks ni bundlers. Todo se sirve estáticamente. |
| **Hosting** | Cloudflare Pages | Deploy automático desde GitHub (`main`). |
| **Backend (BaaS)** | Supabase | Postgres (Base de datos), Auth (Google OAuth), Storage (Buckets para imágenes). |
| **Cliente DB** | `supabase-js` (CDN) | Conexión directa desde el navegador con `anon key` pública. |

## 3. Estructura de Archivos (Frontend)
```
├── index.html        # Shell HTML. Importa CSS y JS.
├── css/
│   └── app.css       # Todos los estilos (variables, layout, componentes).
└── js/
    ├── config.js     # Constantes: SUPABASE_URL, ANON_KEY, BUCKET_NAME.
    ├── data.js       # Datos por defecto (shows, presets, defaults).
    ├── app.js        # Helpers globales (fmtDate, toast, nav, modo edición).
    ├── auth.js       # Google Login, ROLE_DEFS, restricciones de UI.
    ├── shows.js      # CRUD de Shows, Ficha Técnica, Paneles de detalle.
    ├── roadmap.js    # Hoja de ruta (secciones y tareas), Presets.
    ├── presupuesto.js# Presupuesto, Cierre, Invitados.
    ├── finanzas.js   # Reportes gráficos y financieros (EECC, Flujo).
    ├── contenido.js  # Módulo de Contenido Digital (CRUD, Kanban, Gantt).
    ├── equipo.js     # Equipo (Personas, Asignaciones, Multimedia, Bitácora).
    ├── planner.js    # Planificador (vistas Anual, Calendario; dispatcher _renderPlannerView).
    └── export.js     # Exportación a CSV y descarga de Fichas.
```

## 4. Modelo de Datos Clave (Supabase)
| Tabla | Propósito | Relación |
|---|---|---|
| `shows` | Eventos principales. | 1:N con `ficha_tecnica`, `roadmap_secciones`, `presupuesto_items`, `cierre_items`, `invitados`. |
| `contenido_digital` | Piezas de marketing (reels, posts). | 1:N con `contenido_tasks`, `contenido_logs`, `contenido_metricas`, `media_items`. |
| `personas` | Miembros del equipo. | 1:N con `asignaciones` (entidad polimórfica: `show` o `contenido`). |
| `media_items` | Archivos multimedia. | Polimórfica: `show_id` o `contenido_id`. Almacenamiento en bucket `show-media`. |
| `perfiles` | Usuarios autenticados (Google). | Vinculado a `personas` vía `perfil_id` para heredar foto/nombre. |

## 5. Patrones de Persistencia (Obligatorios)
Para mantener la integridad de las FK y evitar IDs huérfanos, se usa un patrón específico según el tipo de relación:

- **Relación 1:1** (`ficha_tecnica` → `shows`):
  `upsert(payload, { onConflict: "show_id" })` en cada edición de campo.

- **Relación 1:N con edición de campo individual** (`contenido_digital`, `contenido_tasks`, etc.):
  `UPDATE` puntual por `id` (ej: `saveCdCampo`). No se tocan las demás filas.

- **Relación 1:N con alta/baja de ítems** (`contenido_digital`, `invitados`):
  - **Alta:** `INSERT` puntual capturando el `id` devuelto (`insertCdItem`).
  - **Baja:** `DELETE` puntual por `id` (`deleteCdItem`).
  - **Edición:** `UPDATE` puntual por `id`.

- **Relaciones 1:N de "borrar y reinsertar todo"** (solo cuando NO hay FKs externas apuntando a los IDs internos):
  Aplica a `roadmap_secciones`, `roadmap_tasks`, `presupuesto_items`, `cierre_items`, `asignaciones` (por entidad). Es aceptable porque estas tablas son "hojas" del árbol y no tienen hijos que las referencien.

## 6. Seguridad y Accesos
- **Autenticación:** Solo Google OAuth. Los usuarios nuevos se crean automáticamente vía trigger en Supabase con rol `invitado`.
- **Autorización (Frontend):** El archivo `ROLE_DEFS` en `auth.js` controla qué secciones y botones ve cada rol (`programador`, `productor`, `artista`, `técnico`, `contador`, `marketing`).
- **Base de Datos (RLS):** Actualmente permisiva (todo usuario autenticado puede leer/escribir casi todo). La seguridad real vive en la interfaz. Esto es una decisión deliberada para agilizar el desarrollo; una granularidad fina vía RLS se evaluará a futuro.

## 7. Convenciones de UI/UX
- **Toast:** Todas las operaciones (guardado, error, éxito) muestran un mensaje flotante mediante `toast(msg)`.
- **Modo Edición de Textos:** Botón "Editar plataforma" que permite modificar textos estáticos (etiquetas, títulos) guardándolos en `localStorage`.
- **Paneles:** Los detalles de shows se abren en un overlay (`panel-overlay`) o en vista completa (`full-detail-overlay`). Las piezas de contenido usan su propio overlay (`cd-full-detail-overlay`).
- **Sincronización:** Tras cualquier cambio, se actualiza la vista activa (re-render) sin recargar la página.

## 8. Convenciones del Planner
- **Dispatcher central:** `_renderPlannerView()` decide qué función de build llamar según `plActiveView`. Siempre llamar esto desde `nav()` y `enterApp()`, nunca `buildPlanner()` directamente.
- **Selector de vista:** `#pl-view-tabs` en `index.html` con tabs `.pl-view-tab`. Agregar nuevas vistas (Gantt, Kanban) sumando un tab aquí y un case en `_renderPlannerView()`.
- **Filtro de tipo:** `plActiveFilter` (`todos` / `shows` / `contenido`) es transversal a todas las vistas del Planner.
- **`groupByWeek(items, getFecha)`:** Función global en `planner.js`. Recibe un array y un getter de fecha, devuelve semanas `{key, monday, sunday, items}` ordenadas. Reutilizar en Gantt y Kanban.

---
*Este documento se actualiza cuando hay cambios estructurales importantes en la arquitectura o convenciones de código.*
