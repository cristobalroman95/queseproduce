# Plan de Migración — QueseProduce (Supabase + Cloudflare)
*Última actualización: 19 jun 2026*

> Pegá este archivo completo al inicio de futuras conversaciones para dar contexto rápido del estado de la migración.

## Arquitectura objetivo
- **Frontend:** `index.html` (single-file) servido por Cloudflare Pages, deploy automático desde GitHub.
- **Repo:** `cristobalroman95/queseproduce`, branch `main`.
- **Backend:** Supabase (Postgres + Auth). Conexión directa navegador → Supabase vía `supabase-js`. No hay Cloudflare Functions/Workers todavía.
- **Seguridad:** depende 100% de RLS, porque la `anon key` queda pública en el código fuente del HTML.

## Archivos clave del repo
- `index.html` — versión en producción (la que sirve Cloudflare Pages). Ya tiene el cliente Supabase y el login migrado.
- `QueseProduce_2026_rediseño_4_3.html` — versión vieja, pre-Supabase (login con PIN). **No se usa en el deploy.** Candidata a borrar o archivar.
- Cliente Supabase: línea ~1016-1018 de `index.html` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `const sb = supabase.createClient(...)`).

## Estado por tabla (al 19 jun 2026)

| Tabla | Filas en DB | ¿Conectada al front? | Notas |
|---|---|---|---|
| `perfiles` | — | ✅ Sí | usada en login: rol, nombre, vencimiento |
| `sesiones` | — | ✅ Sí (solo insert) | log de logins |
| `shows` | 18 | ❌ No | front usa `DEFAULT_SHOWS` hardcodeado |
| `ficha_tecnica` | 18 | ❌ No | |
| `roadmap_secciones` | 83 | ❌ No | |
| `roadmap_tasks` | 290 | ❌ No | |
| `presupuesto_items` | 203 | ❌ No | |
| `cierre_items` | 252 | ❌ No | |
| `contenido_digital` | 10 | ❌ No | |
| fotos/media | no existe tabla | ❌ No | hoy se guardan como dataURL en `localStorage` |

**Punto clave:** la base de datos está poblada pero el frontend todavía no la lee. Sigue funcionando 100% con `localStorage` salvo login.

## Orden de migración recomendado
1. **Verificar/configurar RLS** en las 7 tablas de datos (bloqueante — hacer primero)
2. `shows` — reemplazar `DEFAULT_SHOWS` por fetch a Supabase
3. `ficha_tecnica` (relación 1:1 con shows)
4. `roadmap_secciones` + `roadmap_tasks` (1:N, uso diario)
5. `presupuesto_items`
6. `cierre_items`
7. `contenido_digital`
8. *(futuro)* migrar fotos de `localStorage` dataURL a Supabase Storage

Razón del orden: todo depende de `show_id` (FK a `shows`), así que conviene validar el patrón lectura/escritura ahí primero y replicarlo.

## Patrón de código a seguir en cada paso
- Reemplazar la función `load*()` que lee `localStorage` por una versión `async` con `sb.from(tabla).select("*")`.
- Las funciones `save*()` pasan de `localStorage.setItem` a `sb.from(tabla).upsert()/.insert()/.update()`.
- Errores: mostrar el toast existente (`#toast`) en vez de fallar silenciosamente.
- Decidir si `localStorage` se mantiene como cache de lectura o se elimina del todo (pendiente).

## Decisiones pendientes
- ¿RLS activado en las 7 tablas? ¿con qué policies por rol?
- ¿Se mantiene `localStorage` como fallback offline o se saca del todo?
- ¿Cuándo migrar fotos a Supabase Storage?
- Mapeo de permisos por rol (`programador`, `productor`, `contador`, `tecnico`, `marketing`, `artista`) a operaciones CRUD por tabla.

## Estado de esta conversación
- **Paso actual:** Paso 1 — verificación de RLS.
- **Próximo paso:** conectar tabla `shows` al frontend.