import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RegisterUseCase } from '../src/modules/auth/application/register.use-case';
import { LoginUseCase } from '../src/modules/auth/application/login.use-case';
import { LogoutUseCase } from '../src/modules/auth/application/logout.use-case';
import { RefreshUseCase } from '../src/modules/auth/application/refresh.use-case';
import { AuthApplicationError } from '../src/modules/auth/application/auth-application.error';
import { PrismaService } from '../src/shared/database/prisma.service';
import { GlobalExceptionFilter } from '../src/shared/errors/global-exception.filter';

interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'PUBLIC_USER';
}

interface TestAuthState {
  users: Map<string, TestUser>;
  refreshTokens: Map<string, { user: TestUser; family: string }>;
  consumedTokens: Set<string>;
  revokedFamilies: Set<string>;
  tokenIndex: number;
}

interface AuthResponsePayload {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
}

function authResponseBody(response: { body: unknown }): AuthResponsePayload {
  return response.body as AuthResponsePayload;
}

function createAuthFakes(state: TestAuthState) {
  const invalidCredentials = () =>
    new AuthApplicationError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
    );
  const invalidRefresh = () =>
    new AuthApplicationError(
      401,
      'INVALID_REFRESH_TOKEN',
      'Invalid refresh token',
    );
  const issueTokens = (
    user: TestUser,
    family = `family-${state.tokenIndex}`,
  ) => {
    const index = ++state.tokenIndex;
    const refreshToken = `refresh-${index}`;
    state.refreshTokens.set(refreshToken, { user, family });
    return {
      accessToken: `access-${index}`,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  };

  return {
    register: {
      execute: jest.fn(
        ({ email, password }: { email: string; password: string }) => {
          const normalizedEmail = email.trim().toLowerCase();
          if (state.users.has(normalizedEmail)) {
            throw new AuthApplicationError(
              409,
              'EMAIL_ALREADY_REGISTERED',
              'Email already registered',
            );
          }
          const user: TestUser = {
            id: `user-${state.users.size + 1}`,
            email: normalizedEmail,
            password,
            role: 'PUBLIC_USER',
          };
          state.users.set(normalizedEmail, user);
          return Promise.resolve({
            id: user.id,
            email: user.email,
            role: user.role,
          });
        },
      ),
    },
    login: {
      execute: jest.fn(
        ({ email, password }: { email: string; password: string }) => {
          const user = state.users.get(email.trim().toLowerCase());
          if (!user || user.password !== password) {
            throw invalidCredentials();
          }
          return Promise.resolve(issueTokens(user));
        },
      ),
    },
    refresh: {
      execute: jest.fn(({ refreshToken }: { refreshToken: string }) => {
        const session = state.refreshTokens.get(refreshToken);
        if (!session) {
          throw invalidRefresh();
        }
        if (state.consumedTokens.has(refreshToken)) {
          state.revokedFamilies.add(session.family);
          throw invalidRefresh();
        }
        if (state.revokedFamilies.has(session.family)) {
          throw invalidRefresh();
        }
        state.consumedTokens.add(refreshToken);
        return Promise.resolve(issueTokens(session.user, session.family));
      }),
    },
    logout: {
      execute: jest.fn(({ refreshToken }: { refreshToken: string }) => {
        const session = state.refreshTokens.get(refreshToken);
        if (session) {
          state.revokedFamilies.add(session.family);
        }
        return Promise.resolve();
      }),
    },
  };
}

function createState(): TestAuthState {
  return {
    users: new Map(),
    refreshTokens: new Map(),
    consumedTokens: new Set(),
    revokedFamilies: new Set(),
    tokenIndex: 0,
  };
}

async function createApp(
  limit: number,
  state: TestAuthState,
  trustedProxyIps: string[] = [],
): Promise<INestApplication<App>> {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  process.env.JWT_ACCESS_SECRET =
    'test-access-secret-that-is-at-least-32-characters';
  process.env.JWT_REFRESH_SECRET =
    'test-refresh-secret-that-is-at-least-32-characters';
  process.env.AUTH_THROTTLE_LIMIT = String(limit);
  process.env.AUTH_THROTTLE_TTL = '60000';
  process.env.NODE_ENV = 'test';

  const { AppModule } =
    jest.requireActual<typeof import('../src/app.module')>('../src/app.module');
  const authFakes = createAuthFakes(state);
  const configValues: Record<string, unknown> = {
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-characters',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '7d',
    BCRYPT_SALT_ROUNDS: 10,
    AUTH_THROTTLE_LIMIT: limit,
    AUTH_THROTTLE_TTL: 60000,
    TRUSTED_PROXY_IPS: trustedProxyIps,
  };
  const testingModule: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RegisterUseCase)
    .useValue(authFakes.register)
    .overrideProvider(LoginUseCase)
    .useValue(authFakes.login)
    .overrideProvider(RefreshUseCase)
    .useValue(authFakes.refresh)
    .overrideProvider(LogoutUseCase)
    .useValue(authFakes.logout)
    .overrideProvider(PrismaService)
    .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
    .overrideProvider(ConfigService)
    .useValue({
      get: (key: string, fallback?: unknown) => configValues[key] ?? fallback,
      getOrThrow: (key: string) => {
        const value = configValues[key];
        if (value === undefined) {
          throw new Error(`Unexpected config key: ${key}`);
        }
        return value;
      },
    })
    .compile();
  const app = testingModule.createNestApplication<
    INestApplication<App> & NestExpressApplication
  >();
  app.set('trust proxy', trustedProxyIps);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CLENA API')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  await app.init();
  return app;
}

describe('Auth endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let throttleApp: INestApplication<App>;
  let trustedProxyApp: INestApplication<App>;
  let untrustedProxyApp: INestApplication<App>;
  let state: TestAuthState;

  beforeAll(async () => {
    state = createState();
    app = await createApp(100, state);
    throttleApp = await createApp(2, createState());
    trustedProxyApp = await createApp(1, createState(), ['127.0.0.1/8']);
    untrustedProxyApp = await createApp(1, createState());
  });

  afterAll(async () => {
    await app?.close();
    await throttleApp?.close();
    await trustedProxyApp?.close();
    await untrustedProxyApp?.close();
  });

  it('registers a public user and returns access and refresh tokens without hashes', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: ' New.User@Example.com ', password: 'strong-password' })
      .expect(201)
      .expect((response) => {
        const body = authResponseBody(response);
        expect(typeof body.accessToken).toBe('string');
        expect(typeof body.refreshToken).toBe('string');
        expect(body.user).toEqual({
          id: 'user-1',
          email: 'new.user@example.com',
          role: 'PUBLIC_USER',
        });
        expect(JSON.stringify(body)).not.toMatch(/passwordHash|tokenHash/i);
        expect(body.user).not.toHaveProperty('password');
      });
  });

  it('rejects role assignment and unknown request properties', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'role@example.com',
        password: 'strong-password',
        role: 'ADMIN',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'strong-password',
        unexpected: true,
      })
      .expect(400);
  });

  it('rejects malformed or incomplete registration, login, and refresh bodies', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: '' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({})
      .expect(400);
  });

  it('accepts passwords up to 72 UTF-8 bytes and rejects longer passwords', async () => {
    const ascii72 = 'a'.repeat(72);
    const ascii73 = 'a'.repeat(73);
    const multibyte72 = '€'.repeat(24);
    const multibyte73 = `${'a'.repeat(71)}é`;

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'ascii-limit@example.com', password: ascii72 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ascii-limit@example.com', password: ascii72 })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'ascii-long@example.com', password: ascii73 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ascii-limit@example.com', password: ascii73 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'multibyte-limit@example.com', password: multibyte72 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'multibyte-limit@example.com', password: multibyte72 })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'multibyte-long@example.com', password: multibyte73 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'multibyte-limit@example.com', password: multibyte73 })
      .expect(400);
  });

  it('normalizes email and rejects duplicate registrations with 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: ' Duplicate@Example.com ', password: 'strong-password' })
      .expect(201)
      .expect((response) => {
        const body = authResponseBody(response);
        expect(body.user.email).toBe('duplicate@example.com');
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.com', password: 'strong-password' })
      .expect(409);
  });

  it('returns tokens for valid login and a generic 401 for invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.com', password: 'strong-password' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ' LOGIN@example.com ', password: 'strong-password' })
      .expect(200)
      .expect((response) => {
        const body = authResponseBody(response);
        expect(typeof body.accessToken).toBe('string');
        expect(typeof body.refreshToken).toBe('string');
        expect(body.user.email).toBe('login@example.com');
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'incorrect-password' })
      .expect(401)
      .expect((response) => {
        expect((response.body as { message: string }).message).toBe(
          'Invalid email or password',
        );
      });
  });

  it('rotates refresh tokens and revokes the family after replay', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'refresh@example.com', password: 'strong-password' })
      .expect(201);
    const oldToken = authResponseBody(registration).refreshToken;
    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldToken })
      .expect(200);
    const newToken = authResponseBody(rotated).refreshToken;
    expect(newToken).not.toBe(oldToken);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: newToken })
      .expect(401);
    expect(state.revokedFamilies.size).toBe(1);
  });

  it('logs out only the presented device family and remains idempotent', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'logout@example.com', password: 'strong-password' })
      .expect(201);
    const firstDeviceToken = authResponseBody(registration).refreshToken;
    const secondLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'logout@example.com', password: 'strong-password' })
      .expect(200);
    const secondDeviceToken = authResponseBody(secondLogin).refreshToken;
    const revokedFamiliesBeforeLogout = state.revokedFamilies.size;

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: firstDeviceToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: firstDeviceToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'invalid-token' })
      .expect(204);
    expect(state.revokedFamilies.size).toBe(revokedFamiliesBeforeLogout + 1);

    const secondDeviceRefresh = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: secondDeviceToken })
      .expect(200);
    const activeSecondDeviceToken =
      authResponseBody(secondDeviceRefresh).refreshToken;

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: activeSecondDeviceToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: activeSecondDeviceToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: activeSecondDeviceToken })
      .expect(401);
  });

  it('returns 429 after the configured auth endpoint limit is reached', async () => {
    const payload = {
      email: 'throttle@example.com',
      password: 'strong-password',
    };
    await request(throttleApp.getHttpServer())
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(201);
    await request(throttleApp.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...payload, email: 'throttle2@example.com' })
      .expect(201);
    await request(throttleApp.getHttpServer())
      .post('/api/v1/auth/login')
      .send(payload)
      .expect(429);
  });

  it('uses forwarded client IPs only when the immediate proxy is trusted', async () => {
    await request(trustedProxyApp.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', '198.51.100.10')
      .send({ email: 'forwarded1@example.com', password: 'strong-password' })
      .expect(201);
    await request(trustedProxyApp.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', '198.51.100.11')
      .send({ email: 'forwarded2@example.com', password: 'strong-password' })
      .expect(201);

    await request(untrustedProxyApp.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', '198.51.100.20')
      .send({ email: 'spoofed1@example.com', password: 'strong-password' })
      .expect(201);
    await request(untrustedProxyApp.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', '198.51.100.21')
      .send({ email: 'spoofed2@example.com', password: 'strong-password' })
      .expect(429);
  });

  it('documents all auth endpoints and their request DTOs', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('CLENA API').setVersion('1.0').build(),
    );
    expect(document.paths).toHaveProperty('/api/v1/auth/register');
    expect(document.paths).toHaveProperty('/api/v1/auth/login');
    expect(document.paths).toHaveProperty('/api/v1/auth/refresh');
    expect(document.paths).toHaveProperty('/api/v1/auth/logout');
    expect(document.components?.schemas).toHaveProperty('RegisterDto');
    expect(document.components?.schemas).toHaveProperty('LoginDto');
    expect(document.components?.schemas).toHaveProperty('RefreshDto');
    expect(document.components?.schemas).toHaveProperty('LogoutDto');
    expect(document.components?.schemas?.RegisterDto).toHaveProperty(
      'properties.email',
    );
    expect(document.components?.schemas?.RegisterDto).not.toHaveProperty(
      'properties.role',
    );
  });

  it('serves the generated API documentation under /docs', async () => {
    await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)
      .expect((response) => {
        const document = response.body as {
          paths: Record<string, unknown>;
        };
        expect(document.paths).toHaveProperty('/api/v1/auth/register');
        expect(document.paths).toHaveProperty('/api/v1/auth/login');
        expect(document.paths).toHaveProperty('/api/v1/auth/refresh');
        expect(document.paths).toHaveProperty('/api/v1/auth/logout');
      });
  });
});
