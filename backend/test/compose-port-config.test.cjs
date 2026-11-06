const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const composeFile = path.resolve(__dirname, '..', '..', 'docker-compose.yml');
const defaultEnvironment = { ...process.env };
delete defaultEnvironment.PORT;
delete defaultEnvironment.HOST_PORT;

function getBackendConfig(environment) {
  const config = execFileSync(
    'docker',
    ['compose', '--file', composeFile, 'config', '--format', 'json'],
    { encoding: 'utf8', env: environment },
  );
  return JSON.parse(config).services.backend;
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

const healthcheck = customBackend.healthcheck.test.join(' ');
assert.match(healthcheck, /process\.env\.PORT/);

console.log('Compose default and custom port configuration passed.');
