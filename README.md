# Casa Creadores 🟡

Plataforma SaaS de influencer marketing que conecta marcas de cripto/fintech con creadores
hispanohablantes de LATAM. Pagos en USDC, sin fricción bancaria.

## Stack

- **Backend**: Express.js + TypeScript + Prisma ORM
- **Frontend**: React + Vite + Tailwind CSS
- **Base de datos**: PostgreSQL
- **Auth**: JWT (access + refresh) + verificación de email
- **Pagos**: USDC simulado en el MVP (punto de extensión para Circle API)

## Estructura del monorepo

```
/
├── packages/
│   ├── frontend/   React + Vite + Tailwind (SPA)
│   ├── backend/    Express + Prisma (API REST)
│   └── shared/     Tipos TypeScript compartidos
├── .env.example
├── docker-compose.yml   (Postgres local para desarrollo)
└── README.md
```

## Requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (local, Docker, o un servicio administrado como Railway/Supabase)

## Instalación local

1. **Clona el repo e instala dependencias** (usa npm workspaces, un solo `npm install` en la raíz):

   ```bash
   npm install
   ```

2. **Levanta PostgreSQL.** Con Docker:

   ```bash
   docker compose up -d
   ```

   O usa una instancia de Postgres ya existente.

3. **Configura las variables de entorno.** Copia `.env.example` a `.env` dentro de
   `packages/backend/` y `packages/frontend/` (o en la raíz y ajusta según tu setup), y
   completa al menos `DATABASE_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`:

   ```bash
   cp .env.example packages/backend/.env
   cp .env.example packages/frontend/.env
   ```

   En `packages/frontend/.env` solo necesitas `VITE_API_URL`.

4. **Corre las migraciones de Prisma:**

   ```bash
   npm run db:migrate
   ```

5. **Siembra datos demo** (admin, marca demo, 10 creadores, 3 campañas):

   ```bash
   npm run db:seed
   ```

6. **Levanta backend y frontend en paralelo:**

   ```bash
   npm run dev
   ```

   - Backend: http://localhost:4000
   - Frontend: http://localhost:5173

   O por separado: `npm run dev:backend` / `npm run dev:frontend`.

## Credenciales demo

| Rol     | Email                          | Password    |
|---------|---------------------------------|-------------|
| Admin   | admin@casacreadores.com         | admin123    |
| Marca   | marca@casacreadores.demo        | marca123    |
| Creador | creador1@casacreadores.demo     | creador123  |

(`creador1` a `creador10@casacreadores.demo`, misma contraseña `creador123`.)

## Verificación de email

El backend **solo exige verificación por email si hay un proveedor configurado**
(`SMTP_HOST` + `SMTP_USER`). Es una decisión deliberada: sin proveedor, el usuario nunca
recibiría el enlace y la cuenta quedaría permanentemente bloqueada.

- **Sin SMTP configurado** (estado actual): `POST /api/auth/register` crea la cuenta ya
  activa y devuelve `accessToken` + `refreshToken`, de modo que el registro termina
  directamente en el panel. La respuesta incluye `requiresVerification: false`.
- **Con SMTP configurado**: el registro devuelve `requiresVerification: true` y la cuenta
  queda pendiente hasta visitar el enlace enviado por correo.

Puedes comprobar en qué modo está el backend desplegado con `GET /api/health`, que
devuelve `emailDelivery: "configured" | "not-configured"` y los orígenes CORS permitidos.

## Rutas de la API

```
GET    /api/health

POST   /api/auth/register
POST   /api/auth/verify
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/brands/me
PUT    /api/brands/me

GET    /api/creators                 (listado / matching, filtros: nicho, minFollowers, verified)
GET    /api/creators/me
PUT    /api/creators/me
GET    /api/creators/:id

GET    /api/campaigns                (activas por defecto)
GET    /api/campaigns/mine           (marca)
GET    /api/campaigns/mine/applications (creador)
POST   /api/campaigns                (marca)
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id/status     (marca)
POST   /api/campaigns/:id/apply      (creador)
GET    /api/campaigns/:id/applications (marca)
PATCH  /api/campaigns/:id/applications/:appId (marca)

GET    /api/payments/mine            (marca)
POST   /api/payments                 (marca, simula pago en USDC)

POST   /api/contact                 (público, formulario de contacto)

GET    /api/admin/creators
PATCH  /api/admin/creators/:id/verify
GET    /api/admin/payments
GET    /api/admin/stats
GET    /api/admin/contact-messages
PATCH  /api/admin/contact-messages/:id
```

## Contacto y redes sociales

El sitio no muestra emails ni perfiles inventados:

- **Contacto**: el enlace lleva a `/contacto`, un formulario que guarda el mensaje en base
  de datos (`ContactMessage`) y se revisa desde la pestaña *Mensajes* del panel admin.
  Si defines `VITE_CONTACT_EMAIL`, además se muestra ese email como alternativa.
- **Redes sociales**: los perfiles reales están fijados en
  `packages/frontend/src/lib/site.ts`, así que el footer los muestra sin depender de
  ninguna variable. Hoy solo existe X (`https://x.com/casadecrear`); LinkedIn e Instagram
  están vacíos y por eso no se renderizan, en vez de mostrar un `href="#"` que no lleva a
  ninguna parte. `VITE_SOCIAL_X`, `VITE_SOCIAL_LINKEDIN` y `VITE_SOCIAL_INSTAGRAM`
  siguen sirviendo para sobrescribirlos sin tocar código.

## Modelo de datos (Prisma)

`User → Brand | Creator`, `Brand → Campaign → CampaignApplication ← Creator`,
`Brand → Payment → Campaign`. Ver `packages/backend/prisma/schema.prisma` para el detalle
completo de campos y enums.

## Pagos en USDC

El MVP simula la transacción: `POST /api/payments` genera un `txHash` mock y marca el pago
como `COMPLETED` de inmediato. El punto de extensión para producción es reemplazar
`simulateUsdcTransaction()` en `packages/backend/src/routes/payments.routes.ts` por una
integración real con **Circle API** (o Stripe Crypto), usando las variables
`CIRCLE_API_KEY` / `CIRCLE_API_URL` ya presentes en `.env.example`.

## Deploy

El repo incluye configuración as-code para ambas plataformas, así que no hace falta
tocar build/start commands a mano en los dashboards:

- `railway.json` (raíz del repo): build command, start command (corre `prisma migrate
  deploy` automáticamente antes de arrancar el server en cada deploy), y healthcheck en
  `/api/health`.
- `packages/frontend/vercel.json`: output directory y rewrite para que las rutas de
  React Router (`/login`, `/marca`, `/creador`, etc.) no den 404 al refrescar o entrar
  directo por URL. El rewrite excluye `/api/*` a propósito (ver más abajo).
- `packages/frontend/api/[...path].ts`: función serverless que reenvía `/api/*` al
  backend de Railway.
- `packages/frontend/package.json` tiene un script `vercel-build` que Vercel detecta y
  ejecuta automáticamente (compila `shared` antes que `frontend`).

### Cómo habla el frontend con el backend

El navegador **no** llama a Railway directamente: llama a `/api/...` en el mismo dominio
de Vercel, y la función serverless reenvía la petición al backend.

```
navegador ──HTTPS──> casa-creadores.vercel.app/api/auth/login
                          │  (función api/[...path].ts, mismo origen)
                          └──> casa-creadores-production.up.railway.app/api/auth/login
```

Esto es deliberado, y viene de un incidente real: el frontend se construyó sin
`VITE_API_URL`, así que el bundle de producción quedó apuntando a
`http://localhost:4000/api`. En una página HTTPS eso falla siempre (mixed content, y
además no hay nada escuchando en el equipo del visitante), de modo que **registro, login
y contacto mostraban "No pudimos conectar con el servidor"** mientras la landing, que no
llama a la API, funcionaba con normalidad.

Con el proxy:

- **No hay CORS que romper.** El navegador solo habla con el dominio de Vercel.
- **No hay URL congelada en el bundle.** `BACKEND_URL` se lee en cada petición, así que
  cambiar de backend no exige reconstruir el frontend.
- **No hay variables obligatorias.** La URL de Railway está como valor por defecto en el
  código; `BACKEND_URL` solo hace falta si cambia.
- **Los fallos se explican solos.** Sin backend configurado o accesible, la API responde
  503/502 con el motivo concreto en vez de un error de red genérico.

Como red de seguridad, si `/api` devolviera HTML en vez de JSON (señal de que la función
no está desplegada), el frontend reintenta automáticamente contra la URL de Railway; el
backend acepta por CORS cualquier origen `*.vercel.app`.

Puedes comprobar todo esto en producción visitando **`/diagnostico`**, que muestra qué
URL de API se está usando, de dónde salió y si el backend responde.

### Backend → Railway

1. Crea un nuevo proyecto en Railway conectado a este repo (root directory: la raíz del
   repo, sin cambiar nada — `railway.json` ya define el resto).
2. Agrega un plugin de **Postgres** al proyecto (te da `DATABASE_URL` automáticamente,
   referenciable como variable en el servicio del backend).
3. Variables de entorno del servicio: `DATABASE_URL` (referencia al plugin de Postgres),
   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`. Las tres primeras son
   obligatorias: sin ellas el proceso no arranca y el log dice exactamente cuál falta.
   `FRONTEND_URL` es opcional (CORS ya acepta `*.vercel.app` y localhost); defínela si usas
   un dominio propio o si activas la verificación por email.
4. Deploy. Las migraciones corren solas en cada arranque (parte del `startCommand`).
5. Siembra los datos demo una sola vez desde la Railway CLI:
   `railway run npm run db:seed --workspace=packages/backend`.

### Frontend → Vercel

1. Importa el repo en Vercel.
2. **Root directory**: `packages/frontend` (Vercel detecta el monorepo por el lockfile
   en la raíz y usa `vercel-build` automáticamente).
3. Deploy. **No hace falta configurar ninguna variable de entorno**: la URL del backend
   está en el código. Define `BACKEND_URL` solo si el backend cambia de dirección.

## Scripts útiles

```bash
npm run build          # build de shared + backend + frontend
npm run db:migrate     # prisma migrate dev
npm run db:seed        # prisma db seed
npm run db:studio      # abre Prisma Studio
```

## Limitaciones conocidas del MVP

- Sin integración real con APIs de X/Instagram/TikTok: los perfiles de creadores se
  cargan manualmente.
- Sin KYC: solo verificación de email + aprobación manual de creadores desde el panel admin.
- Pagos en USDC simulados (mock de transacción), listos para conectar Circle API.
- Analítica básica (contadores en el panel admin), sin dashboards avanzados.
