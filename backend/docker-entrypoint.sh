#!/bin/sh
set -eu

if [ "${NODE_ENV:-development}" = "production" ]; then
  if [ "${DATABASE_URL:-}" = "postgresql://clena:clena_local_only@postgres:5432/clena?schema=public" ] ||
    [ "${POSTGRES_PASSWORD:-}" = "clena_local_only" ] ||
    [ "${JWT_ACCESS_SECRET:-}" = "dev-only-access-secret-replace-before-production-00000000" ] ||
    [ "${JWT_REFRESH_SECRET:-}" = "dev-only-refresh-secret-replace-before-production-00000000" ]; then
    echo "Production startup blocked: development fallback credentials are active. Set DATABASE_URL, POSTGRES_PASSWORD, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET to production values." >&2
    exit 1
  fi
fi

./node_modules/.bin/prisma migrate deploy

if [ "${NODE_ENV:-development}" = "development" ] &&
  [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
  npm run db:seed
fi

exec "$@"
