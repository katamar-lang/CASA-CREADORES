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
- **Redes sociales**: los iconos del footer solo aparecen si defines `VITE_SOCIAL_X`,
  `VITE_SOCIAL_LINKEDIN` o `VITE_SOCIAL_INSTAGRAM`. Sin configurar, no se renderiza
  ningún enlace (en vez de un `href="#"` que no lleva a ninguna parte).

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
  directo por URL.
- `packages/frontend/package.json` tiene un script `vercel-build` que Vercel detecta y
  ejecuta automáticamente (compila `shared` antes que `frontend`).

### Backend → Railway

1. Crea un nuevo proyecto en Railway conectado a este repo (root directory: la raíz del
   repo, sin cambiar nada — `railway.json` ya define el resto).
2. Agrega un plugin de **Postgres** al proyecto (te da `DATABASE_URL` automáticamente,
   referenciable como variable en el servicio del backend).
3. Variables de entorno a configurar en el servicio del backend: `DATABASE_URL`
   (referencia al plugin de Postgres), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
   `FRONTEND_URL` (la URL de Vercel, se actualiza en el paso 5 de Vercel), `NODE_ENV=production`.
4. Deploy. Las migraciones corren solas en cada arranque (parte del `startCommand`).
5. Siembra los datos demo una sola vez desde la Railway CLI:
   `railway run npm run db:seed --workspace=packages/backend`.

### Frontend → Vercel

1. Importa el repo en Vercel.
2. **Root directory**: `packages/frontend` (Vercel detecta el monorepo por el lockfile
   en la raíz y usa `vercel-build` automáticamente).
3. Variable de entorno: `VITE_API_URL` apuntando a la URL pública del backend en Railway
   (ej. `https://tu-backend.up.railway.app/api`).
4. Deploy.
5. Una vez desplegado, actualiza `FRONTEND_URL` en Railway con la URL final de Vercel para
   que CORS y los links de verificación de email apunten correctamente.

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
