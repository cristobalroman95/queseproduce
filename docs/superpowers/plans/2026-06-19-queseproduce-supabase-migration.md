# QueseProduce → Supabase + Cloudflare Pages Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `QueseProduce_2026_rediseño_4_3.html` a una plataforma online con backend Supabase, preservando al máximo la estética y funcionalidad actuales, y dejando la base lista para app móvil futura.

**Architecture:** Patrón **Strangler Fig** + **capa de persistencia abstracta**. El HTML/CSS/JS de UI se mantiene casi intacto. Solo se reemplazan `load*`/`save*` de `localStorage` por un `DataStore` async que habla con Supabase. Datos anidados complejos (presupuesto, cierre, roadmap, ficha técnica) van en columnas **JSONB** para no reescribir los ~40 renderers existentes. Auth conserva UX de nombre + PIN vía Edge Function que emite sesión Supabase.

**Tech Stack:** HTML/CSS/Vanilla JS (actual), Supabase (Postgres + Auth + Storage + Edge Functions), Cloudflare Pages, `@supabase/supabase-js` v2

## Global Constraints

- **Estética:** No cambiar `:root`, clases CSS, layout sidebar/topbar, tipografías Oswald/Inter, ni copy visible salvo textos editables en modo edición.
- **Funcionalidad:** Todas las secciones actuales deben seguir operativas: dashboard, coordinación, shows, contenido digital, finanzas, hoja de ruta, planner, equipo, usuarios, modales, export CSV, descarga HTML/PDF, lightbox multimedia, modo edición de textos.
- **Roles:** Mantener los 6 roles (`programador`, `productor`, `artista`, `contador`, `tecnico`, `marketing`) con mismas restricciones de secciones y tabs.
- **Login UX:** Mantener pantalla actual (nombre + PIN), no obligar email en fase 1.
- **Mobile-ready:** Schema con `org_id` desde el inicio (single org por ahora) para escalar después.
- **Free tier:** Supabase Free + Cloudflare Pages Free.

---

## Estrategia clave: no reescribir la UI

```
┌─────────────────────────────────────────┐
│  index.html (misma estructura DOM)      │
│  styles.css (CSS extraído, sin cambios) │
│  app.js (build*, render*, nav*, etc.)   │
│  data-store.js (NUEVO — única capa nueva)│
└─────────────────┬───────────────────────┘
                  │ async API
┌─────────────────▼───────────────────────┐
│  Supabase: Postgres + Storage + Auth    │
└─────────────────────────────────────────┘
```

**Regla de oro:** Ninguna función `build*` o `render*` se toca hasta que su `load*`/`save*` correspondiente pase por `DataStore`.

---

## Inventario de persistencia actual

| Clave localStorage | Funciones | Migrar a |
|---|---|---|
| `qp_shows` | `loadShows`, `saveShows` | tabla `shows` (+ JSONB) |
| `qp_presets` | `loadPresets`, `savePresets` | tabla `roadmap_presets` |
| `qp_contenido_v1` | `loadContenido`, `saveContenidoData` | tabla `contenido_digital` |
| `qp_users_v1` | `loadUsers`, `saveUsers` | tabla `app_users` |
| `qp_session_v1` | `doLogin`, `doLogout`, init | Supabase Auth session |
| `qp_sessions` | `buildSessionsWidget` | tabla `login_sessions` |
| `qp_edits_v1` | `loadEdits`, `saveEdits` | tabla `platform_edits` |
| `qp_photo_{n}_{id}` | `savePhoto`, `loadPhoto` | Supabase Storage `show-media/` |
| `qp_data_version` | versionado | columna `schema_version` en config |

---

## Esquema Supabase (SQL)

```sql
-- Organización (single tenant por ahora, multi-tenant ready)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'QueseProduce',
  created_at timestamptz default now()
);

-- Usuarios de app (PIN-based, mapea DEFAULT_USERS)
create table app_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) not null,
  legacy_id text, -- u0, u1, etc. para migración
  nombre text not null,
  rol text not null check (rol in ('programador','productor','artista','contador','tecnico','marketing')),
  pin_hash text not null, -- bcrypt del PIN
  exp date,
  nota text,
  active boolean default true,
  created_at timestamptz default now()
);

create table shows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) not null,
  n int not null,
  nombre text not null,
  venue text,
  ciudad text,
  fecha date,
  hora text,
  aforo int default 0,
  ticket int default 0,
  obj numeric default 0,
  tipo text,
  estado text,
  vendidas int,
  notas text,
  -- JSONB: evita reescribir UI
  ficha_tecnica jsonb default '{}',
  presupuesto jsonb default '{}',
  cierre jsonb default '{}',
  roadmap jsonb default '[]',
  invitados jsonb default '[]',
  sort_order int,
  updated_at timestamptz default now(),
  unique(org_id, n)
);

create table contenido_digital (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) not null,
  legacy_id text,
  nombre text not null,
  tipo text,
  plataforma text,
  estado text,
  responsable text,
  fecha date,
  show_id uuid references shows(id) on delete set null,
  url text,
  notas text,
  updated_at timestamptz default now()
);

create table roadmap_presets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) not null,
  preset_key text not null, -- teatro, show_bar, etc.
  data jsonb not null,
  unique(org_id, preset_key)
);

create table platform_edits (
  org_id uuid references organizations(id) not null,
  edit_key text not null, -- hash del selector DOM o data-edit-id
  content text not null,
  updated_at timestamptz default now(),
  primary key (org_id, edit_key)
);

create table login_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) not null,
  nombre text,
  rol text,
  logged_at timestamptz default now()
);

create table show_media (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) not null,
  show_id uuid references shows(id) on delete cascade not null,
  caption text,
  storage_path text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Config global
create table app_config (
  org_id uuid primary key references organizations(id),
  data_version text default 'v11_2',
  updated_at timestamptz default now()
);
```

**Storage bucket:** `show-media` (público autenticado, max 5MB por archivo en free tier).

**RLS:** Todas las tablas filtran por `org_id`. Políticas adicionales por `rol` vía claim JWT `user_role` (seteado en Edge Function al login).

---

## Estructura de archivos objetivo

```
queseproduce/
├── index.html              # shell + DOM (extraído del HTML actual)
├── public/
│   └── favicon.ico
├── css/
│   └── styles.css          # <style> actual, sin cambios visuales
├── js/
│   ├── config.js           # SUPABASE_URL, SUPABASE_ANON_KEY
│   ├── supabase-client.js  # init client
│   ├── data-store.js       # capa async (reemplaza localStorage)
│   ├── auth.js             # doLogin/doLogout adaptados
│   ├── app.js              # resto del JS actual
│   └── seed/               # scripts de migración one-time
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql
│   └── functions/
│       └── login-with-pin/
│           └── index.ts
├── .env.example
├── wrangler.toml           # Cloudflare Pages (opcional)
└── docs/
```

---

## Fases y timeline

| Fase | Duración | Entregable | Riesgo UI |
|------|----------|------------|-----------|
| 0 — Setup | 1 día | Repo + cuentas + deploy estático del HTML actual | Ninguno |
| 1 — Extracción | 1–2 días | CSS/JS separados, misma app funcionando | Bajo |
| 2 — Supabase schema | 1 día | Tablas + seed desde DEFAULT_* | Ninguno |
| 3 — DataStore + Shows | 2–3 días | Shows online, sync multi-dispositivo | Bajo |
| 4 — Auth PIN | 1–2 días | Login online con roles | Medio |
| 5 — Resto de datos | 2–3 días | Contenido, presets, users, edits | Bajo |
| 6 — Media Storage | 1–2 días | Fotos en Storage (no base64) | Medio |
| 7 — RLS + QA | 2 días | Permisos por rol verificados | Bajo |
| 8 — PWA + polish | 1 día | Instalable en celular (web) | Ninguno |

**Total estimado:** 12–17 días de trabajo enfocado.

---

## Fase 0 — Hacer HOY (sin tocar la UI)

### Task 0: Setup inicial

**Files:**
- Create: estructura de carpetas
- Modify: mover `QueseProduce_2026_rediseño_4_3.html` → `legacy/QueseProduce_2026_rediseño_4_3.html` (backup)

- [ ] **Step 1: Crear cuenta Supabase**
  - Ir a https://supabase.com → New project
  - Nombre: `queseproduce`
  - Región: South America (São Paulo) — menor latencia desde Chile/Argentina
  - Guardar: Project URL, anon key, service_role key (solo local, nunca en frontend)

- [ ] **Step 2: Crear cuenta Cloudflare**
  - Pages → Create project → Connect Git (después) o Direct Upload
  - Por ahora: subir HTML tal cual como smoke test

- [ ] **Step 3: Inicializar git en el proyecto**

```bash
cd c:\Users\IleveN\Documents\queseproduce
git init
echo "node_modules/`n.env`n.env.local`nsupabase/.temp/" > .gitignore
git add .
git commit -m "chore: initial QueseProduce project with migration plan"
```

- [ ] **Step 4: Crear `.env.example`**

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
# Solo para scripts locales / Edge Functions:
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Fase 1 — Extraer CSS/JS (sin cambiar comportamiento)

### Task 1: Split del monolito HTML

**Files:**
- Create: `index.html`, `css/styles.css`, `js/app.js`, `js/config.js`
- Source: `QueseProduce_2026_rediseño_4_3.html`

- [ ] **Step 1: Extraer CSS**
  - Copiar líneas 9–454 (bloque `<style>`) → `css/styles.css`
  - En `index.html`: `<link rel="stylesheet" href="css/styles.css">`

- [ ] **Step 2: Extraer JS**
  - Copiar líneas 1012–4283 (bloque `<script>`) → `js/app.js`
  - En `index.html`: `<script type="module" src="js/app.js"></script>`

- [ ] **Step 3: Verificar paridad visual**
  - Abrir `index.html` en browser local
  - Checklist: login, landing, dashboard, sidebar, colores, modales

- [ ] **Step 4: Deploy a Cloudflare Pages**
  - Build command: (ninguno — sitio estático)
  - Output directory: `/`
  - Verificar URL pública carga igual que local

**Criterio de éxito:** Pixel-identical al HTML original en todas las secciones.

---

## Fase 2 — Schema Supabase + Seed

### Task 2: Migración SQL + datos iniciales

**Files:**
- Create: `supabase/migrations/001_initial.sql`
- Create: `js/seed/import-defaults.mjs` (script one-time con service role)

- [ ] **Step 1: Aplicar SQL en Supabase SQL Editor**
  - Pegar schema completo de arriba
  - Habilitar RLS en todas las tablas (policies en Fase 7)

- [ ] **Step 2: Insertar org default**

```sql
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'QueseProduce');
```

- [ ] **Step 3: Seed app_users desde DEFAULT_USERS**
  - PINs demo hasheados con bcrypt: 0000, 1111, 2222, 3333, 4444, 5555
  - Script lee constantes del JS original

- [ ] **Step 4: Seed shows desde DEFAULT_SHOWS**
  - Por cada show: insertar fila + JSONB para ficha, presupuesto, cierre, roadmap, invitados
  - Usar `defaultPresupuesto()`, `defaultCierre()`, `freshRoadmapFromPreset()` del JS como referencia

- [ ] **Step 5: Seed contenido digital + presets**

**Criterio de éxito:** Supabase Table Editor muestra 18 shows, 6 users, 10 contenido items, 4 presets.

---

## Fase 3 — Capa DataStore (corazón de la migración)

### Task 3: Crear `data-store.js`

**Files:**
- Create: `js/supabase-client.js`, `js/data-store.js`
- Modify: `js/app.js` — reemplazar calls directos a localStorage

**Interfaces que produce:**

```javascript
// js/data-store.js
export const DataStore = {
  // Shows
  async getShows() → Show[],
  async saveShow(show) → void,
  async saveAllShows(shows) → void,  // batch upsert

  // Presets
  async getPresets() → Record<string, Preset>,
  async savePresets(presets) → void,

  // Contenido
  async getContenido() → ContenidoItem[],
  async saveContenidoItem(item) → void,
  async deleteContenidoItem(id) → void,

  // Users (solo programador)
  async getUsers() → AppUser[],
  async saveUser(user) → void,

  // Edits
  async getEdits() → Record<string, string>,
  async saveEdit(key, content) → void,

  // Media
  async uploadPhoto(showId, file, meta) → { id, url },
  async getPhotos(showId) → PhotoMeta[],
  async deletePhoto(showId, photoId) → void,

  // Sessions log
  async logSession(nombre, rol) → void,
  async getRecentSessions(limit=20) → Session[],

  // Feature flag
  useRemote: boolean,  // false = localStorage fallback
};
```

- [ ] **Step 1: Instalar supabase-js**

```bash
npm init -y
npm install @supabase/supabase-js
```

- [ ] **Step 2: Implementar `getShows()` / `saveShow()`**
  - Mapear fila DB ↔ objeto JS actual (mismos nombres de propiedad)
  - JSONB columns se parsean/stringifican transparentemente

- [ ] **Step 3: Adaptar inicialización en app.js**

```javascript
// Antes:
let SHOWS = loadShows();

// Después:
let SHOWS = [];
async function initApp() {
  SHOWS = await DataStore.getShows();
  PRESETS_ROADMAP = await DataStore.getPresets();
  CONTENIDO = await DataStore.getContenido();
  // ... resto de init
  enterApp(); // o mostrar login
}
```

- [ ] **Step 4: Hacer async todas las funciones save***
  - `saveShows()` → `await DataStore.saveAllShows(SHOWS)`
  - Agregar `toast('Guardando...')` / manejo de error mínimo

- [ ] **Step 5: Mantener fallback localStorage**
  - Si `!DataStore.useRemote` o error de red → usar loadShows original
  - Permite desarrollo offline y rollback instantáneo

**Criterio de éxito:** Crear/editar show en web desplegada → visible en otro navegador/dispositivo.

---

## Fase 4 — Auth con PIN (preservar UX)

### Task 4: Edge Function `login-with-pin`

**Files:**
- Create: `supabase/functions/login-with-pin/index.ts`
- Modify: `js/auth.js`

**Flujo:**
1. Usuario ingresa nombre + PIN (igual que hoy)
2. Frontend llama Edge Function con `{ nombre, pin }`
3. Function busca en `app_users`, verifica bcrypt, chequea `exp`
4. Function crea/recupera Supabase Auth user vinculado
5. Retorna session JWT con claims: `{ org_id, user_role, display_name }`
6. Frontend guarda session en supabase client (reemplaza `qp_session_v1`)

- [ ] **Step 1: Crear Edge Function**
- [ ] **Step 2: Adaptar `doLogin()` — misma UI, distinto backend**
- [ ] **Step 3: Adaptar `doLogout()` — `supabase.auth.signOut()`**
- [ ] **Step 4: Adaptar `initAuth()` — `supabase.auth.getSession()`**
- [ ] **Step 5: Adaptar `applyRoleVisibility()` — leer rol del JWT**

**Criterio de éxito:** Login con PIN 1111 como Productor → mismas secciones visibles que hoy.

---

## Fase 5 — Migrar datos restantes

### Task 5a: Contenido digital
- [ ] Reemplazar `loadContenido`/`saveContenidoData`
- [ ] Verificar kanban semanal + vista lista + filtros

### Task 5b: Roadmap presets
- [ ] Reemplazar `loadPresets`/`savePresets`
- [ ] Verificar aplicar preset a show nuevo

### Task 5c: Usuarios (sección programador)
- [ ] CRUD usuarios contra `app_users`
- [ ] PIN hasheado al crear/editar (nunca plain text en DB)

### Task 5d: Modo edición de textos
- [ ] Reemplazar `loadEdits`/`saveEdits`
- [ ] Agregar `data-edit-id` estable a elementos `.edit-zone` (mejor que hash de selector)

### Task 5e: Sesiones recientes
- [ ] `buildSessionsWidget()` lee de `login_sessions`

---

## Fase 6 — Multimedia en Storage

### Task 6: Migrar fotos de base64 localStorage → Supabase Storage

**Problema actual:** fotos como data URL en localStorage (límite ~5MB total por dominio).

**Solución:**
- Upload → bucket `show-media/{org_id}/{show_id}/{uuid}.jpg`
- DB guarda `storage_path` + metadata
- `renderMediaGrid()` usa URL pública firmada o signed URL

- [ ] **Step 1: Crear bucket + policies**
- [ ] **Step 2: Adaptar `savePhoto()` / `loadPhoto()` / `deletePhoto()`**
- [ ] **Step 3: Script migración one-time** (si hay fotos en localStorage de usuarios beta)

**Criterio de éxito:** Subir foto en show → visible en otro dispositivo, lightbox funciona.

---

## Fase 7 — RLS y permisos por rol

### Task 7: Row Level Security

**Policies por rol (via JWT claim `user_role`):**

| Rol | shows SELECT | shows UPDATE | finanzas | usuarios |
|-----|-------------|-------------|----------|----------|
| programador | all | all | yes | yes |
| productor | all | all | yes | no |
| artista | all | partial | yes | no |
| contador | all | cierre only | yes | no |
| tecnico | all | ficha+roadmap only | no | no |
| marketing | all | contenido only | no | no |

- [ ] **Step 1: Policy base: `org_id = auth.jwt()->>'org_id'`**
- [ ] **Step 2: Policies restrictivas por rol en shows UPDATE**
- [ ] **Step 3: Ocultar columnas financieras en API para técnico** (opcional: views)
- [ ] **Step 4: QA manual con los 6 PINs demo**

---

## Fase 8 — PWA (acceso móvil web, sin app nativa aún)

### Task 8: Progressive Web App

**Files:**
- Create: `manifest.json`, `sw.js`

- [ ] **Step 1: manifest.json** — nombre, icono, theme_color `#16123A`
- [ ] **Step 2: Service worker** — cache de CSS/JS/fonts (offline read-only)
- [ ] **Step 3: `<meta name="theme-color">` en index.html**
- [ ] **Step 4: Probar "Agregar a pantalla de inicio" en Android/iOS**

---

## Mapa de funciones JS a tocar (referencia)

| Función actual | Cambio |
|---|---|
| `loadShows()` | → `DataStore.getShows()` |
| `saveShows()` | → `DataStore.saveAllShows()` |
| `loadPresets()` | → `DataStore.getPresets()` |
| `savePresets()` | → `DataStore.savePresets()` |
| `loadContenido()` | → `DataStore.getContenido()` |
| `saveContenidoData()` | → por item async |
| `loadUsers()` | → `DataStore.getUsers()` |
| `saveUsers()` | → `DataStore.saveUser()` |
| `loadEdits()` | → `DataStore.getEdits()` |
| `saveEdits()` | → `DataStore.saveEdit()` |
| `doLogin()` | → Edge Function + supabase session |
| `savePhoto()` | → Storage upload |
| `build*()` / `render*()` / `nav()` | **NO TOCAR** salvo await init |

---

## Qué NO hacer (para preservar estética/funcionalidad)

1. **No migrar a React/Vue** en esta fase — reescribiría toda la UI
2. **No normalizar JSONB** (presupuesto item por item) — refactor enorme sin beneficio inmediato
3. **No cambiar paleta CSS** ni renombrar clases
4. **No cambiar flujo de modales** ni IDs del DOM
5. **No eliminar modo edición** — solo cambiar dónde persiste
6. **No cambiar export CSV/PDF** — pueden seguir generándose client-side

---

## Checklist de regresión visual/funcional (antes de cada deploy)

- [ ] Login con los 6 roles
- [ ] Dashboard: stats, barras, tabla shows
- [ ] Coordinación: filtros proximos/riesgo
- [ ] Shows: CRUD, filtros, panel detalle completo (8 tabs)
- [ ] Contenido digital: kanban + lista + filtros
- [ ] Finanzas: 4 sub-tabs (consolidado, gráficos, EERR, flujo)
- [ ] Hoja de ruta: presets, edición inline
- [ ] Planner: calendario mensual
- [ ] Equipo: tablas editables
- [ ] Usuarios: CRUD (solo programador)
- [ ] Modo edición + restaurar textos
- [ ] Export CSV + descarga HTML show
- [ ] Lightbox multimedia
- [ ] Responsive básico (sidebar, tablas scroll)

---

## Preparación futura app móvil (sin implementar ahora)

Lo que este plan deja listo:
- Supabase SDK funciona en React Native / Expo
- Misma API para web y móvil
- Auth session portable
- Storage URLs usables desde app nativa
- Realtime (opcional después): suscripción a `shows.updated_at` para sync en venue

Próximo proyecto después de Fase 8: **Expo app** que consume `DataStore` equivalente en TypeScript.

---

## Orden de ejecución recomendado

```
HOY     → Fase 0 (cuentas + git + deploy HTML actual)
Semana 1 → Fase 1 + 2 (split + schema)
Semana 2 → Fase 3 + 4 (shows online + auth)
Semana 3 → Fase 5 + 6 + 7 (resto + media + RLS)
Semana 4 → Fase 8 + QA final
```
