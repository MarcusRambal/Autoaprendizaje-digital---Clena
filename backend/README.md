# CLENA Backend

NestJS API for the CLENA digital self-learning application.

## Local development with Compose

The Compose stack has working local-development defaults, so a fresh clone can
start without creating an environment file. Compose automatically reads a
root `.env` if one exists, but does not read `.env.example` directly. Copy
`.env.example` to `.env` only when you want to override the defaults. These
credentials are for local development only and must not be used in production.
NestJS and Prisma also load the root `.env` when commands are run from
`backend/`; Vite loads only `VITE_` variables from it.

To run PostgreSQL and Nginx in Docker while running NestJS and Vite on the host:

```bash
docker compose up -d --build postgres nginx
cd backend
npx prisma migrate deploy
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

For this host-based backend flow, `DATABASE_URL` must use
`localhost:5433`. When the backend itself runs as a Compose service, Compose
overrides it with the internal `postgres:5432` address.

### Full Compose stack

From the repository root, start the complete stack:

```bash
docker compose up
```

Compose builds and starts PostgreSQL, the API, frontend, Nginx, and Prisma
Studio. Open `http://localhost` for the frontend,
`http://localhost:3000/health` for the API health check,
`http://localhost:3000/docs` for Swagger, and `http://localhost:5555` for
Prisma Studio. The database is also available on `localhost:5433`.
The container applies Prisma migrations before starting. In development it
also seeds demo content and three demo accounts. The default credentials are
listed under "Demo accounts" below.

Studio starts with the rest of the Compose stack, after the API and its
migrations are healthy. It connects to the Compose PostgreSQL database, and its
port is bound to the local machine only. Set `PRISMA_STUDIO_HOST_PORT` in the
root `.env` to use a different local port.

After starting the stack, verify that Studio can query the database with:

```bash
node backend/test/prisma-studio-smoke.test.cjs
```

For a custom Studio port, pass its URL as an argument, for example
`node backend/test/prisma-studio-smoke.test.cjs http://127.0.0.1:15555`.

Stop the services with `docker compose down`. The named `postgres-data` volume
is preserved, so database content is available on the next startup. Do not use
the default Compose credentials outside local development.

To run Prisma commands directly from `backend/`, install dependencies and set
`DATABASE_URL` to a PostgreSQL URL reachable from the host:

```bash
npm ci
npx prisma migrate deploy
npm run db:seed
```

Use the repository-root `.env.example` as the template for the single root
`.env` file.

## Environment

| Variable              | Required        | Default                                     | Description                                                                         |
| --------------------- | --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Yes             | `localhost:5433` for host-based development | PostgreSQL connection URL                                                           |
| `POSTGRES_PASSWORD`   | No              | `clena_local_only`                          | Local-only PostgreSQL password; Compose builds the container URL from this          |
| `POSTGRES_HOST_PORT`  | No              | `5433`                                      | Host port mapped to PostgreSQL (5432 inside Compose)                                |
| `HOST_PORT`           | No              | `3000`                                      | Host port mapped to the API                                                         |
| `PRISMA_STUDIO_HOST_PORT` | No           | `5555`                                      | Local port for the Prisma Studio service                                            |
| `NGINX_HOST_PORT`     | No              | `80`                                        | Local port for the frontend and reverse proxy                                       |
| `FRONTEND_URL`        | No              | `http://localhost`                          | Frontend origin allowed by CORS; use `http://localhost:5173` for local Vite          |
| `PORT`                | No              | `3000`                                      | API container/listening port                                                        |
| `NODE_ENV`            | No              | `development`                               | `development`, `test`, or `production`                                              |
| `JWT_ACCESS_SECRET`   | No              | Local development key                       | Access-token signing key, at least 32 characters; replace outside local development |
| `JWT_REFRESH_SECRET`  | No              | Different local development key             | Refresh-token signing key; replace outside local development                        |
| `JWT_ACCESS_TTL`      | No              | `15m`                                       | Access-token lifetime (`ms`, `s`, `m`, `h`, or `d`)                                 |
| `JWT_REFRESH_TTL`     | No              | `7d`                                        | Refresh-token lifetime (`ms`, `s`, `m`, `h`, or `d`)                                |
| `BCRYPT_SALT_ROUNDS`  | No              | `12`                                        | Password hash cost, from 10 through 15                                              |
| `AUTH_THROTTLE_TTL`   | No              | `60000`                                     | Authentication request window in milliseconds                                       |
| `AUTH_THROTTLE_LIMIT` | No              | `5`                                         | Requests allowed per client during the window                                       |
| `TRUSTED_PROXY_IPS`   | No              | Empty                                       | Comma-separated trusted proxy IPs/CIDRs                                             |
| `SEED_DEMO_DATA`      | No              | `true` in Compose development               | Seed demo categories, at least 10 guides and 10 lessons, and three demo accounts    |
| `SEED_ADMIN_EMAIL`    | No              | `admin@clena.test`                          | Local demo admin email                                                             |
| `SEED_ADMIN_PASSWORD` | No              | `clena-demo-admin-only`                     | Local demo admin password                                                          |
| `SEED_STAFF_EMAIL`    | No              | `staff@clena.test`                          | Local demo staff email                                                             |
| `SEED_STAFF_PASSWORD` | No              | `clena-demo-staff-only`                     | Local demo staff password                                                          |
| `SEED_USER_EMAIL`     | No              | `usuario@clena.test`                        | Local demo public-user email                                                       |
| `SEED_USER_PASSWORD`  | No              | `clena-demo-user-only`                      | Local demo public-user password                                                    |

### Demo accounts

The Compose defaults create all three local-only demo accounts automatically.
Use these credentials to sign in:

```
SEED_ADMIN_EMAIL=admin@clena.test
SEED_ADMIN_PASSWORD=clena-demo-admin-only
SEED_STAFF_EMAIL=staff@clena.test
SEED_STAFF_PASSWORD=clena-demo-staff-only
SEED_USER_EMAIL=usuario@clena.test
SEED_USER_PASSWORD=clena-demo-user-only
```

These accounts and credentials are only for local development. The seed
refreshes their password and role when it runs again and never runs in
production. Override them in a local `.env` if needed.

Set `TRUSTED_PROXY_IPS` only to immediate trusted proxies. Forwarding headers
are ignored for untrusted peers; with no trusted proxy list, no proxy is trusted.
Production startup rejects the development fallback secrets and database
credentials.

## API

- `GET /health` returns `{ "status": "ok" }`.
- Authentication endpoints are under `/api/v1/auth`.
- `POST /api/v1/auth/logout` requires `{ "refreshToken": "..." }`, returns
  `204` idempotently, and revokes the token family for that device when its
  signature is valid. Invalid, expired, or already-revoked tokens also receive
  `204`.
- Swagger documentation is available at `/docs`.
- Request validation rejects unknown fields and transforms validated inputs.
- Errors use `{ statusCode, code, message, timestamp, path }`; unexpected
  failures return a generic 500 response without a stack trace.
- Structured JSON logs redact password, authorization, access-token,
  refresh-token, and token fields.

## Application roles

The public registration endpoint creates `PUBLIC_USER` accounts only. The
intended responsibilities are:

| Role          | Responsibilities                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_USER` | View guides as a guest; use an account to save personal progress.                                                                                                                      |
| `STAFF`       | Manage and publish guides and quizzes, attend help requests, and review basic learning metrics.                                                                                        |
| `ADMIN`       | Manage staff accounts and roles, user deactivation and erasure/anonymization requests, categories, privacy notices and consent terms; review audit records and backup/database status. |

These are intended permissions, not a claim that the corresponding APIs are
implemented. Future endpoints must enforce authorization on the server. An
application event audit trail is distinct from the existing operational logs;
user erasure and backup retention also require a defined data-retention policy.

## Quality commands

Run these commands from `backend/`:

```bash
npm run architecture:check       # production Clean Architecture boundaries
npm run architecture:test-fixture # prove a forbidden Prisma import is rejected
npm run lint
npm run test:cov                 # unit tests and domain/application coverage gates
npm run test:e2e
npm run test:compose-config
npm run build
```

The PostgreSQL integration suite runs in the Compose backend container so it
can reach the private database service:

```bash
# From the repository root
docker compose exec -T backend npm run test:integration -- --runInBand
```

The foundation includes authentication, health, persistence schema, and seed
data. Full CRUD for learning content, activity/progress workflows, staff
management, and CI automation are deferred; this repository does not yet
provide those complete business modules.
