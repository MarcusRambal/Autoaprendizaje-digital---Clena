import { AuthUser } from '../domain/auth-user';
import { AuthRepository } from '../domain/auth.repository';
import { TokenIssuer } from '../domain/token-issuer.port';
import { RefreshUseCase } from './refresh.use-case';

const activeUser: AuthUser = {
  id: 'user-1',
  email: 'person@example.com',
  passwordHash: 'stored-password-hash',
  role: 'PUBLIC_USER',
  status: 'ACTIVE',
};
const verifiedToken = {
  id: 'session-1',
  userId: 'user-1',
  familyId: 'family-1',
};

function setup(
  rotateResult:
    'rotated' | 'replayed' | 'revoked' | 'expired' | 'not-found' = 'rotated',
  user: AuthUser | null = activeUser,
  token: typeof verifiedToken | null = verifiedToken,
) {
  const revokedFamilies: string[] = [];
  const rotated: unknown[] = [];
  const foundUsers: string[] = [];
  const repository: AuthRepository = {
    findUserByEmail: () => Promise.resolve(null),
    findUserById: (id) => {
      foundUsers.push(id);
      return Promise.resolve(id === activeUser.id ? user : null);
    },
    createUser: () => Promise.reject(new Error('not used')),
    createRefreshSession: () => Promise.resolve(true),
    rotateRefreshSession: (input) => {
      rotated.push(input);
      return Promise.resolve({ kind: rotateResult });
    },
    revokeRefreshSessionFamily: (familyId) => {
      revokedFamilies.push(familyId);
      return Promise.resolve();
    },
  };
  const tokens: TokenIssuer = {
    issueAccessToken: () => Promise.resolve('new-access-token'),
    issueRefreshToken: (_userId, familyId) =>
      Promise.resolve({
        id: 'session-2',
        familyId: familyId ?? 'new-family',
        token: 'new-refresh-token',
        expiresAt: new Date('2030-01-02T00:00:00.000Z'),
      }),
    hashRefreshToken: (value) => Promise.resolve(`hashed:${value}`),
    verifyRefreshToken: () => Promise.resolve(token),
  };
  return {
    useCase: new RefreshUseCase(
      repository,
      tokens,
      () => new Date('2029-12-31T00:00:00.000Z'),
    ),
    revokedFamilies,
    rotated,
    foundUsers,
  };
}

describe('RefreshUseCase', () => {
  it('rejects a missing input with 401', async () => {
    const { useCase, rotated } = setup();

    await expect(useCase.execute(undefined as never)).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    expect(rotated).toHaveLength(0);
  });

  it('rotates a valid session by its token hash and returns no persisted hashes', async () => {
    const { useCase, rotated } = setup();
    const result = await useCase.execute({ refreshToken: 'presented-token' });

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: { id: 'user-1', email: 'person@example.com', role: 'PUBLIC_USER' },
    });
    expect(rotated[0]).toMatchObject({
      tokenHash: 'hashed:presented-token',
      expectedSessionId: 'session-1',
      expectedUserId: 'user-1',
      expectedFamilyId: 'family-1',
      consumedAt: new Date('2029-12-31T00:00:00.000Z'),
      nextSession: { tokenHash: 'hashed:new-refresh-token', id: 'session-2' },
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('tokenHash');
    expect(JSON.stringify(result)).not.toContain('stored-token-hash');
  });

  it('rejects active expired sessions through the atomic rotation repository', async () => {
    const { useCase, rotated } = setup('expired');

    await expect(
      useCase.execute({ refreshToken: 'presented-token' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    expect(rotated).toHaveLength(1);
    expect(rotated[0]).toMatchObject({
      tokenHash: 'hashed:presented-token',
      expectedSessionId: 'session-1',
    });
  });

  it('rejects a token without a valid signature before querying the user or session', async () => {
    const { useCase, rotated, foundUsers } = setup(
      'not-found',
      activeUser,
      null,
    );

    await expect(
      useCase.execute({ refreshToken: 'unsigned-token' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    expect(foundUsers).toHaveLength(0);
    expect(rotated).toHaveLength(0);
  });

  it('rejects a validly signed token with no matching database session', async () => {
    const { useCase, rotated } = setup('not-found');

    await expect(
      useCase.execute({ refreshToken: 'presented-token' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    expect(rotated).toHaveLength(1);
  });

  it('rejects a session whose user no longer exists without rotating it', async () => {
    const { useCase, rotated } = setup('rotated', null);

    await expect(
      useCase.execute({ refreshToken: 'presented-token' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    expect(rotated).toHaveLength(0);
  });

  it('revokes the device family and rejects a disabled user', async () => {
    const disabledUser: AuthUser = { ...activeUser, status: 'DISABLED' };
    const { useCase, rotated, revokedFamilies } = setup(
      'revoked',
      disabledUser,
    );

    await expect(
      useCase.execute({ refreshToken: 'presented-token' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    expect(rotated).toHaveLength(0);
    expect(revokedFamilies).toEqual(['family-1']);
  });

  it('rejects a replay after the repository revokes the family transactionally', async () => {
    const { useCase, rotated, revokedFamilies } = setup('replayed');

    await expect(
      useCase.execute({ refreshToken: 'presented-token' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    expect(rotated).toHaveLength(1);
    expect(revokedFamilies).toEqual([]);
  });
});
