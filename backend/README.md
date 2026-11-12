# CLENA Backend

NestJS API for the CLENA digital self-learning application.

## Local development with Compose

The repository-root `.env` is the canonical environment file. Copy
`.env.example` to `.env` once and fill in the local secrets. It is ignored by
Git. NestJS and Prisma load it when commands are run from `backend/`; Vite
loads only `VITE_` variables from it. Compose loads it automatically from the
repository root.

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

From the repository root, start the API and PostgreSQL:

```bash
docker compose up --build --wait
```

Compose publishes the API on `http://localhost:${HOST_PORT:-3000}` and the
PostgreSQL port on `localhost:${POSTGRES_HOST_PORT:-5433}`. Check `/health` for
service health and open `/docs` for the Swagger API reference.
The container applies Prisma migrations before starting. In development it
also seeds demo content when `SEED_DEMO_DATA=true` (the default). Demo
content includes at least 10 guides and 10 lessons. Configure all three demo
account email/password pairs before starting the stack with seeding enabled;
the seed fails early if any role is missing (see "Demo accounts" below).

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
| `POSTGRES_PASSWORD`   | Yes for Compose | None; set in root `.env`                    | PostgreSQL password                                                                 |
| `POSTGRES_HOST_PORT`  | No              | `5433`                                      | Host port mapped to PostgreSQL (5432 inside Compose)                                |
| `HOST_PORT`           | No              | `3000`                                      | Host port mapped to the API                                                         |
| `PORT`                | No              | `3000`                                      | API container/listening port                                                        |
| `NODE_ENV`            | No              | `development`                               | `development`, `test`, or `production`                                              |
| `JWT_ACCESS_SECRET`   | Yes             | Development placeholder                     | Access-token signing key, at least 32 characters                                    |
| `JWT_REFRESH_SECRET`  | Yes             | Different development placeholder           | Refresh-token signing key, at least 32 characters and different from the access key |
| `JWT_ACCESS_TTL`      | No              | `15m`                                       | Access-token lifetime (`ms`, `s`, `m`, `h`, or `d`)                                 |
| `JWT_REFRESH_TTL`     | No              | `7d`                                        | Refresh-token lifetime (`ms`, `s`, `m`, `h`, or `d`)                                |
| `BCRYPT_SALT_ROUNDS`  | No              | `12`                                        | Password hash cost, from 10 through 15                                              |
| `AUTH_THROTTLE_TTL`   | No              | `60000`                                     | Authentication request window in milliseconds                                       |
| `AUTH_THROTTLE_LIMIT` | No              | `5`                                         | Requests allowed per client during the window                                       |
| `TRUSTED_PROXY_IPS`   | No              | Empty                                       | Comma-separated trusted proxy IPs/CIDRs                                             |
| `SEED_DEMO_DATA`      | No              | `true` in Compose development               | Seed demo categories, at least 10 guides and 10 lessons, and three demo accounts    |
| `SEED_ADMIN_EMAIL`    | Yes for seeding | Empty                                       | Unique local admin email                                                            |
| `SEED_ADMIN_PASSWORD` | Yes for seeding | Empty                                       | Admin password, 8 to 72 UTF-8 bytes                                                 |
| `SEED_STAFF_EMAIL`    | Yes for seeding | Empty                                       | Unique local staff email                                                           |
| `SEED_STAFF_PASSWORD` | Yes for seeding | Empty                                       | Staff password, 8 to 72 UTF-8 bytes                                                |
| `SEED_USER_EMAIL`     | Yes for seeding | Empty                                       | Unique local public user email                                                     |
| `SEED_USER_PASSWORD`  | Yes for seeding | Empty                                       | Public user password, 8 to 72 UTF-8 bytes                                          |

### Demo accounts

The seed requires all three account pairs. Set them in the root `.env` before
running `npm run db:seed` or starting Compose with `SEED_DEMO_DATA=true` (the
values below are examples; replace them with unique local-only credentials):

```
SEED_ADMIN_EMAIL=admin@clena.test
SEED_ADMIN_PASSWORD=<your admin password>
SEED_STAFF_EMAIL=staff@clena.test
SEED_STAFF_PASSWORD=<your staff password>
SEED_USER_EMAIL=usuario@clena.test
SEED_USER_PASSWORD=<your user password>
```

Each account needs its own email and a password of 8 to 72 UTF-8 bytes, the
same rules as the registration form. The seed creates one account for each
role with the privacy notice already accepted, refreshes their password and
role when it runs again, and logs the emails (never the passwords). It never
runs in production.

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
