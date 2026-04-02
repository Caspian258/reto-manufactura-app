# Nexo

Plataforma de organización para equipos universitarios de ingeniería.

**Producción:** https://reto-manufactura-app.vercel.app

---

## Qué es Nexo

Nexo es una aplicación web que permite a estudiantes universitarios
organizar sus equipos de trabajo de forma eficiente. Cada equipo tiene
su propio espacio con tareas, tablero Kanban, diagrama Gantt y calendario
de entregas — todo en tiempo real.

## Funcionalidades

- **Equipos** — Crea equipos y comparte el código de invitación de 6
  caracteres para que tus compañeros se unan
- **Tareas** — Crea, edita y borra tareas con nombre, descripción,
  prioridad (alta/media/baja), responsable y fecha límite
- **Kanban** — Tablero con drag-and-drop entre columnas Pendiente,
  En progreso y Completado
- **Gantt** — Diagrama de cronograma dinámico generado desde las tareas
  del equipo
- **Calendario** — Vista mensual de todas las entregas con chips de
  prioridad por día
- **Comentarios** — Discute el avance directamente en cada tarea
- **Mis tareas** — Vista global de todas tus tareas en todos tus equipos,
  con filtros por estado, prioridad y equipo
- **Dashboard** — Resumen de actividad con tareas próximas y métricas
  del equipo
- **Gestión de miembros** — El admin puede expulsar miembros y borrar
  el equipo; cualquier miembro puede salir

## Stack

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) | Framework frontend |
| Firebase Auth | Autenticación con Google |
| Firestore | Base de datos en tiempo real |
| Tailwind CSS v4 | Estilos |
| @dnd-kit/core | Drag-and-drop del Kanban |
| gantt-task-react | Diagrama Gantt |
| @xyflow/react | Diagrama PERT |
| Vercel | Hosting y CI/CD |

## Estructura del proyecto
```
app/
  dashboard/
    page.tsx              # Dashboard global
    layout.tsx            # Sidebar con navegación
    equipos/
      page.tsx            # Lista de equipos
      [id]/page.tsx       # Panel de equipo (Tareas, Kanban, Gantt, Miembros)
    tareas/page.tsx       # Mis tareas con filtros
    calendario/page.tsx   # Calendario mensual
  page.tsx                # Landing page
  layout.tsx              # Layout raíz
components/
  LoginButton.tsx
context/
  AuthContext.tsx
lib/
  firebase.ts             # Inicialización de Firebase
  firestore.ts            # Funciones de base de datos
```

## Desarrollo local

### Requisitos

- Node.js 20+
- Cuenta de Firebase con proyecto creado
- Firebase CLI (`npm install -g firebase-tools`)

### Instalación
```bash
# 1. Clona el repositorio
git clone https://github.com/Caspian258/reto-manufactura-app.git
cd reto-manufactura-app

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env.local
# Edita .env.local con los valores de tu proyecto Firebase

# 4. Inicia el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Variables de entorno
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Encuéntralas en Firebase Console → Configuración del proyecto →
Tus apps → Configuración del SDK.

### Firestore

Despliega las reglas de seguridad y los índices:
```bash
firebase deploy --only firestore --project tu-proyecto
```

## Despliegue

El proyecto usa CI/CD automático con Vercel. Cada push a `main`
despliega automáticamente a producción.

Para despliegue manual:
```bash
vercel --prod
```

## Roadmap

- [ ] Firestore Security Rules por `memberIds` (deuda técnica)
- [ ] Carpetas por equipo con Firebase Storage
- [ ] Integración Canvas LMS vía Developer Key institucional
- [ ] Dominio propio
- [ ] Notificaciones de vencimiento de tareas
- [ ] PERT dinámico generado desde tareas de Firestore

## Bitácora

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo de
cambios y decisiones técnicas.