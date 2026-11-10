import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenIssuer } from './jwt-token-issuer';

describe('JwtTokenIssuer', () => {
  let issuer: JwtTokenIssuer;
  let config: ConfigService;

  beforeEach(() => {
    config = new ConfigService({
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      JWT_ACCESS_TTL: '15m',
      JWT_REFRESH_TTL: '7d',
    });
    issuer = new JwtTokenIssuer(config, new JwtService());
  });

  it('access token round-trips via verifyAccessToken', async () => {
    const token = await issuer.issueAccessToken({
      id: 'u1',
      email: 'a@b.com',
      role: 'STAFF',
    });
    await expect(issuer.verifyAccessToken(token)).resolves.toEqual({
      userId: 'u1',
      email: 'a@b.com',
      role: 'STAFF',
    });
  });

  it('access token is rejected by verifyRefreshToken (different secret)', async () => {
    const token = await issuer.issueAccessToken({
      id: 'u1',
      email: 'a@b.com',
      role: 'STAFF',
    });
    await expect(issuer.verifyRefreshToken(token)).resolves.toBeNull();
  });

  it('refresh token has correct familyId and unique id', async () => {
    const a = await issuer.issueRefreshToken('u1');
    const b = await issuer.issueRefreshToken('u1');
    expect(a.familyId).not.toBe(b.familyId);
    expect(a.id).not.toBe(b.id);
    expect(a.token).not.toBe(b.token);
  });

  it('refresh in the same family preserves familyId', async () => {
    const a = await issuer.issueRefreshToken('u1', 'fam-1');
    expect(a.familyId).toBe('fam-1');
  });

  it('issueRefreshToken expiresAt matches JWT exp', async () => {
    const r = await issuer.issueRefreshToken('u1');
    const decoded = new JwtService().decode<{ exp: number }>(r.token);
    expect(r.expiresAt.getTime()).toBe(decoded.exp * 1000);
    const claims = new JwtService().decode<{ exp: number; iat: number }>(
      r.token,
    );
    expect(claims.exp - claims.iat).toBe(604800);
  });

  it('verifyRefreshToken rejects garbage', async () => {
    await expect(issuer.verifyRefreshToken('garbage')).resolves.toBeNull();
  });

  it('15m TTL is interpreted as 900 seconds', async () => {
    const token = await issuer.issueAccessToken({
      id: 'u1',
      email: 'a@b.com',
      role: 'STAFF',
    });
    const decoded = new JwtService().decode<{ exp: number; iat: number }>(
      token,
    );
    expect(decoded.exp - decoded.iat).toBe(900);
  });

  it('rejects TTL values without units', async () => {
    const invalidConfig = new ConfigService({
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      JWT_ACCESS_TTL: '900',
      JWT_REFRESH_TTL: '7d',
    });
    const invalidIssuer = new JwtTokenIssuer(invalidConfig, new JwtService());

    await expect(
      invalidIssuer.issueAccessToken({
        id: 'u1',
        email: 'a@b.com',
        role: 'STAFF',
      }),
    ).rejects.toThrow(/must be a positive duration with unit/);
  });

  it('verifies an expired refresh signature so session expiry can be checked in persistence', async () => {
    const expiredToken = await new JwtService().signAsync(
      { familyId: 'fam-1' },
      {
        secret: 'b'.repeat(32),
        subject: 'u1',
        jwtid: 'jti-1',
        expiresIn: -60,
        algorithm: 'HS256',
      },
    );

    await expect(issuer.verifyRefreshToken(expiredToken)).resolves.toEqual({
      id: 'jti-1',
      userId: 'u1',
      familyId: 'fam-1',
    });
  });
});
