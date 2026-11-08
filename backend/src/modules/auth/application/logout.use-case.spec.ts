import { AuthRepository } from '../domain/auth.repository';
import { TokenIssuer } from '../domain/token-issuer.port';
import { LogoutUseCase } from './logout.use-case';

const verifiedToken = {
  id: 'session-1',
  userId: 'user-1',
  familyId: 'family-device-1',
};

function setup(token: typeof verifiedToken | null = verifiedToken) {
  const revokedFamilies: Array<{ familyId: string; revokedAt: Date }> = [];
  const repository: AuthRepository = {
    findUserByEmail: () => Promise.resolve(null),
    findUserById: () => Promise.resolve(null),
    createUser: () => Promise.reject(new Error('not used')),
    createRefreshSession: () => Promise.resolve(true),
    rotateRefreshSession: () => Promise.resolve({ kind: 'not-found' }),
    revokeRefreshSessionFamily: (familyId, revokedAt) => {
      revokedFamilies.push({ familyId, revokedAt });
      return Promise.resolve();
    },
  };
  const tokenIssuer: TokenIssuer = {
    issueAccessToken: () => Promise.resolve('access-token'),
    issueRefreshToken: () =>
      Promise.resolve({
        id: 'session-2',
        familyId: 'family-device-1',
        token: 'refresh-token',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      }),
    verifyRefreshToken: () => Promise.resolve(token),
    verifyAccessToken: () => Promise.resolve(null),
    hashRefreshToken: (refreshToken) =>
      Promise.resolve(`hashed:${refreshToken}`),
  };
  return {
    useCase: new LogoutUseCase(
      repository,
      tokenIssuer,
      () => new Date('2029-12-31T00:00:00.000Z'),
    ),
    revokedFamilies,
  };
}

describe('LogoutUseCase', () => {
  it('revokes the verified token family and resolves idempotently', async () => {
    const { useCase, revokedFamilies } = setup();

    await expect(
      useCase.execute({ refreshToken: 'presented-token' }),
    ).resolves.toBeUndefined();
    expect(revokedFamilies).toEqual([
      {
        familyId: 'family-device-1',
        revokedAt: new Date('2029-12-31T00:00:00.000Z'),
      },
    ]);
  });

  it('resolves without revocation when the token is invalid', async () => {
    const { useCase, revokedFamilies } = setup(null);

    await expect(
      useCase.execute({ refreshToken: 'invalid-signature-token' }),
    ).resolves.toBeUndefined();
    expect(revokedFamilies).toEqual([]);
  });

  it('resolves without repository access when no refresh token is supplied', async () => {
    const { useCase, revokedFamilies } = setup();

    await expect(
      useCase.execute({ refreshToken: '' }),
    ).resolves.toBeUndefined();
    expect(revokedFamilies).toEqual([]);
  });
});
