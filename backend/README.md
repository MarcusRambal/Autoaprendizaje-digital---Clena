# CLENA Backend

NestJS API for the CLENA digital self-learning application.

## Local development with Compose

From the repository root, start the API and PostgreSQL:

```bash
docker compose up --build --wait
```

Compose publishes the API on `http://localhost:${HOST_PORT:-3000}`. Check
`/health` for service health and open `/docs` for the Swagger API reference.
The container applies Prisma migrations before starting. In development it
also seeds demo content when `SEED_DEMO_DATA=true` (the default); an admin
account is created only when both optional admin seed credentials are set.

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

`backend/.env.example` contains local development defaults. Compose reads
interpolated overrides from the repository-root `.env` file or shell
environment.

## Environment

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Compose local PostgreSQL URL | PostgreSQL connection URL |
| `POSTGRES_PASSWORD` | No | `clena_local_only` | Compose PostgreSQL password; local only |
| `HOST_PORT` | No | `3000` | Host port mapped to the API |
| `PORT` | No | `3000` | API container/listening port |
| `NODE_ENV` | No | `development` | `development`, `test`, or `production` |
| `JWT_ACCESS_SECRET` | Yes | Development placeholder | Access-token signing key, at least 32 characters |
| `JWT_REFRESH_SECRET` | Yes | Different development placeholder | Refresh-token signing key, at least 32 characters and different from the access key |
| `JWT_ACCESS_TTL` | No | `15m` | Access-token lifetime (`ms`, `s`, `m`, `h`, or `d`) |
| `JWT_REFRESH_TTL` | No | `7d` | Refresh-token lifetime (`ms`, `s`, `m`, `h`, or `d`) |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Password hash cost, from 10 through 15 |
| `AUTH_THROTTLE_TTL` | No | `60000` | Authentication request window in milliseconds |
| `AUTH_THROTTLE_LIMIT` | No | `5` | Requests allowed per client during the window |
| `TRUSTED_PROXY_IPS` | No | Empty | Comma-separated trusted proxy IPs/CIDRs |
| `SEED_DEMO_DATA` | No | `true` in Compose development | Seed demo categories, guide, and activity at startup |
| `SEED_ADMIN_EMAIL` | No | Empty | Optional admin seed email; must be set with password |
| `SEED_ADMIN_PASSWORD` | No | Empty | Optional admin seed password; must be set with email |

Set `TRUSTED_PROXY_IPS` only to immediate trusted proxies. Forwarding headers
are ignored for untrusted peers; with no trusted proxy list, no proxy is trusted.
Production startup rejects the development fallback secrets and database
credentials.

## API

- `GET /health` returns `{ "status": "ok" }`.
- Authentication endpoints are under `/api/v1/auth`.
- Swagger documentation is available at `/docs`.
- Request validation rejects unknown fields and transforms validated inputs.
- Errors use `{ statusCode, code, message, timestamp, path }`; unexpected
  failures return a generic 500 response without a stack trace.
- Structured JSON logs redact password, authorization, access-token,
  refresh-token, and token fields.

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
