# Changelog — manufactura.app

## [2026-04-01] — Refundación Fase 1: modelo de tareas y navegación

**Qué se hizo:**
- **Nuevo modelo de `Task`** en `lib/firestore.ts`: campos `status`, `priority`, `assignedTo`, `assignedToName`, `startDate`, `dueDate`, `description`. Se eliminó `start/end/dependencies` del modelo anterior.
- **Nuevas funciones Firestore**: `updateTask(teamId, taskId, data)` y `deleteTask(teamId, taskId)`. Se eliminó `updateTaskProgress` (reemplazada por `updateTask`).
- **Sidebar dinámico** en `layout.tsx`: sección "General" (Inicio, Mis tareas, Calendario) y sección "Equipos" (lista cargada desde Firestore + botón "Nuevo equipo").
- **Dashboard rediseñado** (`app/dashboard/page.tsx`): 4 tarjetas de resumen (equipos, pendientes, en progreso, completadas esta semana), lista "Mis tareas próximas" (5 más cercanas), grid de equipos.
- **Nueva página "Mis tareas"** (`app/dashboard/tareas/page.tsx`): todas las tareas del usuario con filtros por estado, prioridad y equipo.
- **Nueva página "Calendario"** (`app/dashboard/calendario/page.tsx`): grid mensual con CSS puro, navegación anterior/siguiente, chips de prioridad por día, panel de tareas al hacer click en un día.
- **Panel de equipo rediseñado** (`app/dashboard/equipos/[id]/page.tsx`): pestañas Tareas, Kanban, Gantt y Miembros. Kanban con columnas Pendiente/En progreso/Completado y botones para mover tareas. Gantt usa `startDate`/`dueDate`. Miembros incluye código de invitación con botón copiar.
- **Eliminada carpeta** `app/dashboard/herramientas/` (gantt, pert, ishikawa) — las herramientas viven dentro de cada equipo.

**Archivos modificados:**
`lib/firestore.ts`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/equipos/[id]/page.tsx`.

**Archivos creados:**
`app/dashboard/tareas/page.tsx`, `app/dashboard/calendario/page.tsx`.

**Archivos eliminados:**
`app/dashboard/herramientas/gantt/page.tsx`, `app/dashboard/herramientas/pert/page.tsx`, `app/dashboard/herramientas/ishikawa/page.tsx`.

**Decisión técnica:**
El calendario se implementó con CSS Grid puro (sin librería externa) para mantener el bundle ligero y evitar dependencias no confirmadas con el orquestador. El Kanban usa botones de avance/retroceso en lugar de drag-and-drop para mantener el scope de la Fase 1.

**Pendiente (Fase 2):**
- Kanban drag-and-drop.
- Carpetas/agrupaciones de tareas.
- Comentarios en tareas.
- Integración Canvas LMS.
- PERT dinámico calculado desde tareas de Firestore.
- Notificaciones de vencimiento.

## [2026-03-31] — Gestión de miembros: borrar equipo, salir y expulsar

**Qué se hizo:**
- **Borrar equipo (admin):** botón visible solo para admins, con diálogo de confirmación inline. Borra todas las tareas de la subcolección antes de borrar el documento del equipo. Redirige a `/dashboard/equipos`.
- **Salir del equipo (miembro):** visible para no-admins. Si el usuario es el único admin, lanza error `"Debes nombrar otro admin antes de salir"` sin ejecutar cambios.
- **Ver miembros:** nueva pestaña "Miembros" en el panel del equipo. Lista nombre y rol de cada miembro. El admin ve botón "Expulsar" junto a cada miembro que no sea él mismo.
- **Funciones en `lib/firestore.ts`:** `deleteTeam`, `leaveTeam`, `removeMember`.

**Archivos modificados:**
`app/dashboard/equipos/[id]/page.tsx`, `lib/firestore.ts`.

**Decisión técnica:**
`deleteTeam` borra las tareas de la subcolección manualmente con `Promise.all` antes de borrar el documento padre, ya que Firestore no propaga borrados en cascada automáticamente.
`leaveTeam` y `removeMember` usan `arrayRemove` de Firestore para mantener en sync tanto `members` (array de objetos) como `memberIds` (array de strings).

**Pendiente:**
- PERT dinámico calculado desde tareas de Firestore.
- Integración Canvas LMS (Fase 2 del roadmap).

## [2026-03-31] — Despliegue en Vercel

**Qué se hizo:**
- App desplegada exitosamente en Vercel.
- URL de producción: https://reto-manufactura-app.vercel.app/

**Pendiente crítico:**
- Las Firestore Security Rules están en el repo (`firestore.rules`) pero **aún no activas en producción**. Activarlas con:
  ```
  firebase deploy --only firestore:rules
  ```
  Hasta que se ejecute ese comando, Firestore opera con las reglas por defecto (abiertas o cerradas según la configuración inicial del proyecto Firebase).

## [2026-03-31] — Fix compatibilidad de dependencias para Vercel

**Qué se hizo:**
- Creado `.npmrc` con `legacy-peer-deps=true` para que npm ignore el conflicto de peer dependencies entre `gantt-task-react@0.3.9` (requiere React 18) y el proyecto (React 19).

**Archivos modificados:**
`.npmrc` (nuevo).

**Decisión técnica:**
`legacy-peer-deps` es la solución estándar cuando una dependencia no ha actualizado su `peerDependencies` pero funciona correctamente con la versión más nueva. Vercel usa npm por defecto y fallaba en `npm install` sin esta flag.

**Pendiente:**
- Desplegar en Vercel configurando las 7 variables de entorno de Firebase en el panel.

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
