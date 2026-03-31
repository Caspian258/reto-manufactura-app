# Changelog — manufactura.app

## [2026-03-31] — Firestore Security Rules por memberIds

**Qué se hizo:**
- Creado `firestore.rules` con reglas de seguridad para la colección `teams` y su subcolección `tasks`.
- Un usuario solo puede leer o escribir un equipo si su `uid` está en `memberIds` del documento.
- Las tareas heredan la misma restricción mediante `get()` al documento padre del equipo.
- Creado `firebase.json` apuntando a `firestore.rules` para el despliegue con Firebase CLI.

**Archivos modificados:**
`firestore.rules` (nuevo), `firebase.json` (nuevo).

**Decisión técnica:**
Las tareas usan `get()` sobre el equipo padre en lugar de duplicar `memberIds` en cada tarea, para mantener una sola fuente de verdad. Esto implica un read adicional por operación en las reglas, aceptable a escala universitaria.

**Pendiente:**
- Desplegar las reglas con `firebase deploy --only firestore:rules` (requiere Firebase CLI autenticado).
- PERT dinámico calculado desde tareas de Firestore.
- Integración Canvas LMS (Fase 2 del roadmap).

## [2026-03-31] — Formulario para crear tareas en equipo

**Qué se hizo:**
- Agregado formulario colapsable "＋ Nueva tarea" en `app/dashboard/equipos/[id]/page.tsx`, debajo del header del equipo.
- El formulario recoge nombre, fecha de inicio, fecha de fin y progreso inicial (0-100).
- Al hacer submit llama a `createTask()` de `lib/firestore.ts` y recarga el Gantt automáticamente.
- Validaciones en cliente: nombre obligatorio, fechas obligatorias, fecha fin > fecha inicio.
- Se evitó el tipo `FormEvent` (deprecado en React 19); se tipó el evento mínimamente con `{ preventDefault(): void }`.

**Archivos modificados:**
`app/dashboard/equipos/[id]/page.tsx`

**Decisión técnica:**
El formulario reutiliza `createTask()` existente en `lib/firestore.ts` sin modificaciones. El estado del Gantt se recarga con `loadTasks()` tras el submit exitoso para reflejar la nueva tarea sin recargar página.

**Pendiente:**
- Firestore Security Rules que restrinjan lectura/escritura por `memberIds`.
- PERT dinámico calculado desde tareas de Firestore.
- Integración Canvas LMS (Fase 2 del roadmap).

## [2026-03-31] — Corrección de rutas y bootstrap de Firebase

**Qué se hizo:**
- Renombrados todos los archivos de ruta al nombre que exige Next.js App Router (`page.tsx`, `layout.tsx`). El refactor anterior los había dejado con nombres arbitrarios (`app_page.tsx`, `dashboard_layout.tsx`, etc.) que Next.js ignoraba silenciosamente, dejando la app completamente sin rutas.
- Creado `lib/firebase.ts` que inicializa la app Firebase con variables de entorno y exporta `db` y `auth`. El archivo faltaba y bloqueaba la compilación.
- Corregida la generación de `inviteCode` en `lib/firestore.ts`: ahora toma 6 caracteres de un alfabeto fijo (`A-Z0-9`) garantizando longitud exacta, en lugar de usar `Math.random().toString(36)` que podía producir strings más cortos.

**Archivos modificados:**
`app/layout.tsx` (era `app_layout.tsx`), `app/page.tsx` (era `app_page.tsx`),
`app/dashboard/layout.tsx`, `app/dashboard/page.tsx`,
`app/dashboard/equipos/page.tsx`, `app/dashboard/equipos/[id]/page.tsx`,
`app/dashboard/herramientas/gantt/page.tsx`,
`app/dashboard/herramientas/pert/page.tsx`,
`app/dashboard/herramientas/ishikawa/page.tsx`,
`lib/firebase.ts` (nuevo), `lib/firestore.ts`.

**Decisión técnica:**
Se usó `git mv` para conservar el historial de cada archivo en el renombrado.
`lib/firebase.ts` usa el patrón singleton (`getApps().length ? getApp() : initializeApp(...)`) para evitar reinicializaciones en hot-reload de Next.js.

**Pendiente:**
- Firestore Security Rules que restrinjan lectura/escritura por `memberIds`.
- Formulario para crear tareas desde la UI del equipo.
- PERT dinámico calculado desde tareas de Firestore.
- Integración Canvas LMS (Fase 2 del roadmap).

## [2026-03-31] — Reestructuración base del proyecto

**Qué se hizo:**
- Corregidas las rutas del nav en `dashboard/layout.tsx` (apuntaban todas a `/dashboard/herramientas` inexistente).
- Creadas las rutas `/dashboard/herramientas/gantt`, `/dashboard/herramientas/pert` e `/dashboard/herramientas/ishikawa`.
- Actualizada la metadata de `app/layout.tsx` (título y descripción reales).
- `app/dashboard/page.tsx` ahora muestra resumen real con número de equipos del usuario.
- `lib/firestore.ts` expandido: agregadas funciones `getTeamTasks`, `createTask`, `updateTaskProgress` y `joinTeamByCode`.
- `app/dashboard/equipos/page.tsx` ahora incluye flujo de invitación por código de 6 caracteres.
- `app/dashboard/equipos/[id]/page.tsx` ahora carga tareas reales desde Firestore; si no hay tareas muestra placeholder.
- Corregido el idioma del layout raíz: `lang="es"`.

**Archivos modificados:**
`app/layout.tsx`, `app/page.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`,
`app/dashboard/equipos/page.tsx`, `app/dashboard/equipos/[id]/page.tsx`,
`app/dashboard/herramientas/gantt/page.tsx` (nuevo),
`app/dashboard/herramientas/pert/page.tsx` (nuevo),
`app/dashboard/herramientas/ishikawa/page.tsx` (nuevo),
`lib/firestore.ts`, `AGENTS.md`.

**Decisión técnica:**
Las tareas se almacenan como subcolección `teams/{teamId}/tasks` en Firestore para aislar datos por equipo y facilitar reglas de seguridad.
El código de invitación se genera en el cliente con `Math.random().toString(36)` por simplicidad; en producción se puede mover a una Firebase Function para mayor control.

**Pendiente:**
- Firestore Security Rules que restrinjan lectura/escritura por `memberIds`.
- Formulario para crear tareas desde la UI del equipo.
- Integración Canvas LMS (Fase 2 del roadmap).
