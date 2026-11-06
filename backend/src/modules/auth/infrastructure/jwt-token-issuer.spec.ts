import { createHmac } from 'node:crypto';
import { createHash } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenIssuer } from './jwt-token-issuer';

function decodePayload(token: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
  );
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid JWT payload');
  }
  return parsed as Record<string, unknown>;
}

function isSignedBy(token: string, secret: string): boolean {
  const [header, payload, signature] = token.split('.');
  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return signature === expected;
}

describe('JwtTokenIssuer', () => {
  it('uses separate secrets and includes subject, jti, family, and expiry claims', async () => {
    const accessSecret = 'access-secret-long-enough-for-tests-123';
    const refreshSecret = 'refresh-secret-long-enough-for-tests-456';
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: accessSecret,
          JWT_REFRESH_SECRET: refreshSecret,
          JWT_ACCESS_TTL: '15m',
          JWT_REFRESH_TTL: '7d',
        };
        return values[key];
      }),
    };
    const issuer = new JwtTokenIssuer(config as never);
    const now = Math.floor(Date.now() / 1000);
    const user = {
      id: 'user-1',
      email: 'person@example.com',
      role: 'PUBLIC_USER' as const,
    };

    const accessToken = await issuer.issueAccessToken(user);
    const refresh = await issuer.issueRefreshToken('user-1');
    const access = decodePayload(accessToken);
    const refreshClaims = decodePayload(refresh.token);

    expect(isSignedBy(accessToken, accessSecret)).toBe(true);
    expect(isSignedBy(accessToken, refreshSecret)).toBe(false);
    expect(isSignedBy(refresh.token, refreshSecret)).toBe(true);
    expect(isSignedBy(refresh.token, accessSecret)).toBe(false);
    expect(access).toMatchObject({
      sub: 'user-1',
      email: 'person@example.com',
      role: 'PUBLIC_USER',
    });
    expect(access.jti).toEqual(expect.any(String));
    expect(access.exp).toEqual(expect.any(Number));
    expect((access.exp as number) - now).toBeGreaterThan(0);
    expect((access.exp as number) - now).toBeLessThanOrEqual(900);
    expect(refreshClaims).toMatchObject({
      sub: 'user-1',
      familyId: refresh.familyId,
    });
    expect(refreshClaims.jti).toBe(refresh.id);
    expect(refreshClaims.exp).toEqual(expect.any(Number));
    expect((refreshClaims.exp as number) - now).toBeGreaterThan(0);
    expect((refreshClaims.exp as number) - now).toBeLessThanOrEqual(604800);
  });

  it('continues a refresh family while issuing a fresh jti', async () => {
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret-long-enough-for-tests-123',
          JWT_REFRESH_SECRET: 'refresh-secret-long-enough-for-tests-456',
          JWT_ACCESS_TTL: '15m',
          JWT_REFRESH_TTL: '7d',
        };
        return values[key];
      }),
    };
    const issuer = new JwtTokenIssuer(config as never);
    const first = await issuer.issueRefreshToken('user-1');
    const next = await issuer.issueRefreshToken('user-1', first.familyId);

    expect(next.familyId).toBe(first.familyId);
    expect(next.id).not.toBe(first.id);
    expect(next.token).not.toBe(first.token);
  });

  it('hashes raw refresh tokens with a one-way cryptographic digest', async () => {
    const config = {
      getOrThrow: jest.fn(),
    };
    const issuer = new JwtTokenIssuer(config as never);

    await expect(issuer.hashRefreshToken('raw-refresh-token')).resolves.toBe(
      createHash('sha256').update('raw-refresh-token').digest('hex'),
    );
  });

  it('verifies refresh signatures while leaving expiry decisions to the session transaction', async () => {
    const refreshSecret = 'refresh-secret-long-enough-for-tests-456';
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_REFRESH_SECRET: refreshSecret,
        };
        return values[key];
      }),
    };
    const issuer = new JwtTokenIssuer(config as never);
    const jwt = new JwtService();
    const expiredSignedToken = await jwt.signAsync(
      { familyId: 'family-1' },
      {
        secret: refreshSecret,
        subject: 'user-1',
        jwtid: 'session-1',
        expiresIn: -60,
      },
    );

    await expect(
      issuer.verifyRefreshToken(expiredSignedToken),
    ).resolves.toEqual({
      id: 'session-1',
      userId: 'user-1',
      familyId: 'family-1',
    });

    const [header, payload, signature] = expiredSignedToken.split('.');
    const unsignedToken = `${header}.${payload}.`;
    const invalidSignatureToken = `${header}.${payload}.${signature.slice(0, -2)}aa`;
    await expect(issuer.verifyRefreshToken(unsignedToken)).resolves.toBeNull();
    await expect(
      issuer.verifyRefreshToken(invalidSignatureToken),
    ).resolves.toBeNull();
  });
});
