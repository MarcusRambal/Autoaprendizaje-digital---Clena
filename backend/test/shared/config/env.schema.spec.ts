import { validateEnv } from '../../../src/shared/config/env.schema';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-characters',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  BCRYPT_SALT_ROUNDS: '12',
  AUTH_THROTTLE_TTL: '60000',
  AUTH_THROTTLE_LIMIT: '5',
};

describe('environment configuration validation', () => {
  it('rejects missing JWT secrets', () => {
    const environment: Record<string, unknown> = { ...validEnvironment };
    delete environment.JWT_ACCESS_SECRET;
    delete environment.JWT_REFRESH_SECRET;

    expect(() => validateEnv(environment)).toThrow();
  });

  it('rejects JWT secrets shorter than 32 characters', () => {
    expect(() =>
      validateEnv({
        ...validEnvironment,
        JWT_ACCESS_SECRET: 'short',
      }),
    ).toThrow();
  });

  it('rejects zero-duration JWT TTLs', () => {
    expect(() =>
      validateEnv({
        ...validEnvironment,
        JWT_ACCESS_TTL: '0s',
      }),
    ).toThrow();
    expect(() =>
      validateEnv({
        ...validEnvironment,
        JWT_REFRESH_TTL: '0ms',
      }),
    ).toThrow();
  });

  it('parses valid test settings and converts numeric settings', () => {
    expect(validateEnv(validEnvironment)).toEqual({
      ...validEnvironment,
      PORT: 3000,
      BCRYPT_SALT_ROUNDS: 12,
      AUTH_THROTTLE_TTL: 60000,
      AUTH_THROTTLE_LIMIT: 5,
      TRUSTED_PROXY_IPS: [],
    });
  });

  it('parses configured trusted proxy IPs and CIDRs', () => {
    expect(
      validateEnv({
        ...validEnvironment,
        TRUSTED_PROXY_IPS: '192.0.2.1, 2001:db8::/64',
      }).TRUSTED_PROXY_IPS,
    ).toEqual(['192.0.2.1', '2001:db8::/64']);
  });

  it('treats an empty trusted proxy list as trusting no proxies', () => {
    expect(
      validateEnv({
        ...validEnvironment,
        TRUSTED_PROXY_IPS: '',
      }).TRUSTED_PROXY_IPS,
    ).toEqual([]);
  });

  it('rejects invalid trusted proxy entries', () => {
    expect(() =>
      validateEnv({
        ...validEnvironment,
        TRUSTED_PROXY_IPS: '192.0.2.1/33',
      }),
    ).toThrow();
    expect(() =>
      validateEnv({
        ...validEnvironment,
        TRUSTED_PROXY_IPS: 'proxy.example.com',
      }),
    ).toThrow();
  });
});
