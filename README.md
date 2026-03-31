# Manufactura App

Plataforma de colaboración para equipos de ingeniería universitaria.

**Producción:** https://reto-manufactura-app.vercel.app/

## Qué hace

- Autenticación con Google (Firebase Auth)
- Gestión de equipos con código de invitación de 6 caracteres
- Diagrama Gantt por equipo con tareas reales desde Firestore
- Diagrama PERT interactivo (nodos arrastrables con React Flow)
- Diagrama Ishikawa por equipo

## Stack

- Next.js 16 (App Router)
- React 19
- Firebase (Auth + Firestore)
- Tailwind CSS v4
- TypeScript
- gantt-task-react · @xyflow/react

## Desarrollo local

```bash
# 1. Clonar y entrar al proyecto
git clone https://github.com/Caspian258/reto-manufactura-app.git
cd reto-manufactura-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con los valores reales de tu proyecto Firebase

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

## Variables de entorno requeridas

Todas las variables se declaran en `.env.example`. Son las credenciales del proyecto Firebase (`NEXT_PUBLIC_FIREBASE_*`). Se configuran en Vercel en Settings → Environment Variables.

## Estructura del proyecto

```
app/
  page.tsx                        — Landing / login
  dashboard/
    page.tsx                      — Resumen del usuario
    layout.tsx                    — Sidebar de navegación
    equipos/
      page.tsx                    — Lista de equipos + crear/unirse
      [id]/page.tsx               — Panel del equipo: Gantt, PERT, Ishikawa
    herramientas/
      gantt/page.tsx
      pert/page.tsx
      ishikawa/page.tsx
lib/
  firebase.ts                     — Inicialización Firebase
  firestore.ts                    — Funciones de base de datos
context/
  AuthContext.tsx                 — Proveedor de autenticación
components/
  LoginButton.tsx
firestore.rules                   — Reglas de seguridad Firestore
```

## Firestore Security Rules

Las reglas están en `firestore.rules`. Para activarlas en producción:

```bash
firebase deploy --only firestore:rules
```

Las reglas restringen el acceso a equipos y tareas únicamente a miembros (`memberIds`).

## Despliegue

El proyecto se despliega automáticamente en Vercel desde la rama `main`.
