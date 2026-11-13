const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const composeFile = path.resolve(__dirname, '..', '..', 'docker-compose.yml');
const environmentExample = Object.fromEntries(
  readFileSync(path.resolve(__dirname, '..', '..', '.env.example'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);
const defaultEnvironment = { ...process.env };
delete defaultEnvironment.PORT;
delete defaultEnvironment.HOST_PORT;

const cloneEnvironment = { ...defaultEnvironment };
for (const name of [
  'DATABASE_URL',
  'FRONTEND_URL',
  'HOST_PORT',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'NGINX_HOST_PORT',
  'NODE_ENV',
  'PORT',
  'POSTGRES_HOST_PORT',
  'POSTGRES_PASSWORD',
  'PRISMA_STUDIO_HOST_PORT',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
  'SEED_DEMO_DATA',
  'SEED_STAFF_EMAIL',
  'SEED_STAFF_PASSWORD',
  'SEED_USER_EMAIL',
  'SEED_USER_PASSWORD',
]) {
  delete cloneEnvironment[name];
}

function getComposeConfig(environment, useEmptyEnvFile = false) {
  const args = ['compose'];
  if (useEmptyEnvFile) {
    args.push('--env-file', '/dev/null');
  }
  args.push('--file', composeFile, 'config', '--format', 'json');
  return JSON.parse(
    execFileSync('docker', args, { encoding: 'utf8', env: environment }),
  );
}

function getBackendConfig(environment) {
  return getComposeConfig(environment).services.backend;
}

const defaultBackend = getBackendConfig(defaultEnvironment);
assert.equal(defaultBackend.ports[0].target, 3000);
assert.equal(defaultBackend.ports[0].published, '3000');

const portEnvironment = {
  ...defaultEnvironment,
  PORT: '8080',
  HOST_PORT: '18080',
};
const customBackend = getBackendConfig(portEnvironment);
assert.equal(customBackend.environment.PORT, '8080');
assert.equal(customBackend.ports[0].target, 8080);
assert.equal(customBackend.ports[0].published, '18080');

function getStudioConfig(environment) {
  return getComposeConfig(environment).services['prisma-studio'];
}

const defaultStudio = getStudioConfig(defaultEnvironment);
assert.equal(defaultStudio.profiles, undefined);
assert.equal(defaultStudio.depends_on.backend.condition, 'service_healthy');
assert.equal(defaultStudio.ports[0].host_ip, '127.0.0.1');
assert.equal(defaultStudio.ports[0].target, 5555);
assert.equal(defaultStudio.ports[0].published, '5555');
assert.deepEqual(defaultStudio.command, [
  'studio',
  '--hostname',
  '0.0.0.0',
  '--port',
  '5555',
]);

const cloneConfig = getComposeConfig(cloneEnvironment, true);
assert.equal(
  cloneConfig.services.postgres.environment.POSTGRES_PASSWORD,
  'clena_local_only',
);
assert.equal(
  cloneConfig.services.backend.environment.DATABASE_URL,
  'postgresql://clena:clena_local_only@postgres:5432/clena?schema=public',
);
assert.equal(
  cloneConfig.services.backend.environment.FRONTEND_URL,
  'http://localhost',
);
assert.equal(
  cloneConfig.services.backend.environment.JWT_ACCESS_SECRET,
  'dev-only-access-secret-replace-before-production-00000000',
);
assert.equal(
  cloneConfig.services.backend.environment.JWT_REFRESH_SECRET,
  'dev-only-refresh-secret-replace-before-production-00000000',
);
assert.equal(cloneConfig.services.backend.environment.SEED_DEMO_DATA, 'true');
assert.equal(
  cloneConfig.services.backend.environment.SEED_ADMIN_EMAIL,
  'admin@clena.test',
);
assert.equal(
  cloneConfig.services.backend.environment.SEED_STAFF_EMAIL,
  'staff@clena.test',
);
assert.equal(
  cloneConfig.services.backend.environment.SEED_USER_EMAIL,
  'usuario@clena.test',
);
assert.equal(cloneConfig.services.nginx.ports[0].host_ip, '127.0.0.1');
assert.equal(environmentExample.POSTGRES_PASSWORD, 'clena_local_only');
assert.equal(
  environmentExample.DATABASE_URL,
  `postgresql://clena:${environmentExample.POSTGRES_PASSWORD}@localhost:5433/clena?schema=public`,
);
assert.equal(
  environmentExample.JWT_ACCESS_SECRET,
  cloneConfig.services.backend.environment.JWT_ACCESS_SECRET,
);
assert.equal(
  environmentExample.JWT_REFRESH_SECRET,
  cloneConfig.services.backend.environment.JWT_REFRESH_SECRET,
);
for (const name of [
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
  'SEED_STAFF_EMAIL',
  'SEED_STAFF_PASSWORD',
  'SEED_USER_EMAIL',
  'SEED_USER_PASSWORD',
]) {
  assert.equal(
    environmentExample[name],
    cloneConfig.services.backend.environment[name],
  );
}

const studioPortEnvironment = {
  ...defaultEnvironment,
  PRISMA_STUDIO_HOST_PORT: '15555',
};
const customStudio = getStudioConfig(studioPortEnvironment);
assert.equal(customStudio.ports[0].published, '15555');

const healthcheck = customBackend.healthcheck.test.join(' ');
assert.match(healthcheck, /process\.env\.PORT/);

console.log('Compose defaults, clone setup, and custom ports passed.');
