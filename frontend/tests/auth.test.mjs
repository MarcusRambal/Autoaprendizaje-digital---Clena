import assert from 'node:assert/strict';
import test from 'node:test';
import { accessTokenExpiresAt, appRole, authRequest, homePathForRole, logoutRequest, passwordError } from '../services/authApi.ts';

test('valida la contraseña según el límite de caracteres y bytes del backend', () => {
  assert.ok(passwordError('corta'));
  assert.equal(passwordError('una-frase-segura-123'), null);
  assert.equal(passwordError('á'.repeat(36)), null);
  assert.ok(passwordError('á'.repeat(37)));
  assert.ok(passwordError('😀'.repeat(4)));
  assert.equal(passwordError('😀'.repeat(8)), null);
  assert.ok(passwordError('❤\uFE0F'.repeat(4)));
});

test('mapea roles sin convertir personal en administrador', () => {
  assert.equal(appRole('ADMIN'), 'admin');
  assert.equal(appRole('PUBLIC_USER'), 'student');
  assert.equal(appRole('STAFF'), 'staff');
  assert.equal(homePathForRole('staff'), '/Staff');
  assert.equal(homePathForRole('admin'), '/Admin');
  assert.equal(homePathForRole('student'), '/StudentsHome');
});

test('lee el vencimiento del token y rechaza tokens inválidos', () => {
  const token = `header.${btoa(JSON.stringify({ exp: 12345 }))}.signature`;
  assert.equal(accessTokenExpiresAt(token), 12345000);
  assert.throws(() => accessTokenExpiresAt('invalid'), /inválido/);
});

test('envía las credenciales y valida la respuesta del servidor', async (t) => {
  const session = { accessToken: 'access', refreshToken: 'refresh', user: { id: '1', email: 'a@b.co', role: 'PUBLIC_USER' } };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/v1/auth/register');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { email: 'a@b.co', password: 'password' });
    return new Response(JSON.stringify(session), { status: 201 });
  });
  assert.deepEqual(await authRequest('register', { email: 'a@b.co', password: 'password' }), session);
});

test('muestra errores útiles de API, red y respuesta inválida', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ code: 'EMAIL_ALREADY_REGISTERED' }), { status: 409 }));
  await assert.rejects(authRequest('register', { email: 'a@b.co', password: 'password' }), /ya tiene una cuenta/);
  fetchMock.mock.mockImplementation(async () => new Response('{}', { status: 200 }));
  await assert.rejects(authRequest('login', { email: 'a@b.co', password: 'password' }), /respuesta de sesión inválida/);
  fetchMock.mock.mockImplementation(async () => { throw new Error('offline'); });
  await assert.rejects(authRequest('login', { email: 'a@b.co', password: 'password' }), /conectar con el servidor/);
});

test('envía el refresh token y rechaza una sesión vencida', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/v1/auth/refresh');
    assert.deepEqual(JSON.parse(options.body), { refreshToken: 'old-token' });
    return new Response('{}', { status: 401 });
  });
  await assert.rejects(authRequest('refresh', { refreshToken: 'old-token' }), /sesión incorrectos/);
});

test('envía el refresh token en el body para cerrar sesión', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/v1/auth/logout');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { refreshToken: 'device-token' });
    return new Response(null, { status: 204 });
  });
  await assert.doesNotReject(logoutRequest('device-token'));
});
