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

5. **Siembra datos demo** (admin, marca Hivello, 10 creadores, 3 campañas):

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
| Marca   | marca@hivello.com               | marca123    |
| Creador | creador1@casacreadores.demo     | creador123  |

(`creador1` a `creador10@casacreadores.demo`, misma contraseña `creador123`.)

## Verificación de email en desarrollo

No hay proveedor SMTP configurado por defecto: el link de verificación se imprime en la
consola del backend al registrarte, y la respuesta de `POST /api/auth/register` incluye
`devVerificationUrl` cuando `NODE_ENV !== production`, para facilitar pruebas sin bandeja
de entrada real. Los usuarios sembrados por el seed ya vienen verificados.

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

GET    /api/admin/creators
PATCH  /api/admin/creators/:id/verify
GET    /api/admin/payments
GET    /api/admin/stats
```

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

### Backend → Railway

1. Crea un nuevo proyecto en Railway y agrega un servicio Postgres (te da un `DATABASE_URL`
   automáticamente).
2. Agrega un servicio a partir de este repo, con **root directory** `packages/backend`.
3. Variables de entorno a configurar: `DATABASE_URL` (la de Railway), `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET`, `FRONTEND_URL` (la URL de Vercel una vez la tengas), `NODE_ENV=production`.
4. Build command: `npm install && npm run build --workspace=packages/shared && npm run build --workspace=packages/backend`
   Start command: `npm run start --workspace=packages/backend`
5. Corre las migraciones contra la base de producción una vez desplegado:
   `railway run npm run db:deploy --workspace=packages/backend`
   y siembra los datos demo: `railway run npm run db:seed --workspace=packages/backend`.

### Frontend → Vercel

1. Importa el repo en Vercel.
2. **Root directory**: `packages/frontend`.
3. Build command: `npm install && npm run build --workspace=packages/shared && npm run build --workspace=packages/frontend`
   Output directory: `packages/frontend/dist`.
4. Variable de entorno: `VITE_API_URL` apuntando a la URL pública del backend en Railway
   (ej. `https://tu-backend.up.railway.app/api`).
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
