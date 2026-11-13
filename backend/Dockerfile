FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN chmod +x ./docker-entrypoint.sh \
    && DATABASE_URL=postgresql://localhost:5432/build npx prisma generate \
    && engine_dir="node_modules/prisma/engines/$(node -p "require('@prisma/engines-version').enginesVersion")" \
    && mkdir -p "$engine_dir" \
    && cp node_modules/@prisma/engines/libquery_engine-*.so.node "$engine_dir/" \
    && chown -R node:node node_modules/prisma/engines \
    && npm run build

ENV NODE_ENV=development
EXPOSE 3000

USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
