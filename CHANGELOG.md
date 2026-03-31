# Changelog — manufactura.app

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
