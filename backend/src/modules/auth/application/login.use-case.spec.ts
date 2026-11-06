import { AuthUser } from '../domain/auth-user';
import { AuthRepository } from '../domain/auth.repository';
import { CredentialHasher } from '../domain/credential-hasher.port';
import { TokenIssuer } from '../domain/token-issuer.port';
import { LoginUseCase } from './login.use-case';

const existingUser: AuthUser = {
  id: 'user-1',
  email: 'person@example.com',
  passwordHash: 'stored-password-hash',
  role: 'PUBLIC_USER',
  status: 'ACTIVE',
};

function setup(
  foundUser: AuthUser | null,
  validPassword: boolean,
  sessionCreationAllowed = true,
) {
  const createdSessions: unknown[] = [];
  const repository: AuthRepository = {
    findUserByEmail: (email) =>
      Promise.resolve(foundUser?.email === email ? foundUser : null),
    findUserById: () => Promise.resolve(null),
    createUser: () => Promise.reject(new Error('not used')),
    createRefreshSession: (session) => {
      if (sessionCreationAllowed) {
        createdSessions.push(session);
      }
      return Promise.resolve(sessionCreationAllowed);
    },
    rotateRefreshSession: () => Promise.resolve({ kind: 'not-found' }),
    revokeRefreshSessionFamily: () => Promise.resolve(),
  };
  const hasher: CredentialHasher = {
    hash: (password) => Promise.resolve(`hashed:${password}`),
    verify: (_password, hash) =>
      Promise.resolve(validPassword && hash === existingUser.passwordHash),
  };
  const tokens: TokenIssuer = {
    issueAccessToken: () => Promise.resolve('access-token'),
    issueRefreshToken: (_userId, familyId) =>
      Promise.resolve({
        id: 'session-1',
        familyId: familyId ?? 'family-1',
        token: 'refresh-token',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      }),
    hashRefreshToken: (token) => Promise.resolve(`hashed:${token}`),
    verifyRefreshToken: () => Promise.resolve(null),
  };
  return {
    useCase: new LoginUseCase(repository, hasher, tokens),
    createdSessions,
  };
}

describe('LoginUseCase', () => {
  const invalidCredentials: Array<[string, AuthUser | null, boolean]> = [
    ['unknown email', null, false],
    ['wrong password', existingUser, false],
  ];

  it.each(invalidCredentials)(
    'uses the same unauthorized response for %s',
    async (_label, foundUser, validPassword) => {
      const { useCase } = setup(foundUser, validPassword);

      await expect(
        useCase.execute({ email: 'person@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    },
  );

  it('rejects disabled accounts with the same unauthorized response', async () => {
    const disabledUser = { ...existingUser, status: 'DISABLED' as const };
    const { useCase } = setup(disabledUser, true);

    await expect(
      useCase.execute({ email: 'person@example.com', password: 'secret' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  });

  it('rejects an empty email without looking up an account', async () => {
    const repository = {
      findUserByEmail: jest.fn(() => Promise.resolve(existingUser)),
      findUserById: () => Promise.resolve(null),
      createUser: () => Promise.reject(new Error('not used')),
      createRefreshSession: () => Promise.resolve(true),
      rotateRefreshSession: () =>
        Promise.resolve({ kind: 'not-found' as const }),
      revokeRefreshSessionFamily: () => Promise.resolve(),
    } satisfies AuthRepository;
    const hasher: CredentialHasher = {
      hash: () => Promise.resolve(''),
      verify: () => Promise.resolve(true),
    };
    const tokens: TokenIssuer = {
      issueAccessToken: () => Promise.resolve('access-token'),
      issueRefreshToken: () =>
        Promise.resolve({
          id: 'session-1',
          familyId: 'family-1',
          token: 'refresh-token',
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        }),
      hashRefreshToken: (token) => Promise.resolve(`hashed:${token}`),
      verifyRefreshToken: () => Promise.resolve(null),
    };
    const useCase = new LoginUseCase(repository, hasher, tokens);

    await expect(
      useCase.execute({ email: '  ', password: 'secret' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
    expect(repository.findUserByEmail).not.toHaveBeenCalled();
  });

  it('returns tokens and safe user data without stored hashes', async () => {
    const { useCase, createdSessions } = setup(existingUser, true);
    const result = await useCase.execute({
      email: ' PERSON@example.com ',
      password: 'secret',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1', email: 'person@example.com', role: 'PUBLIC_USER' },
    });
    expect(createdSessions).toEqual([
      expect.objectContaining({
        tokenHash: 'hashed:refresh-token',
        familyId: 'family-1',
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('stored-password-hash');
    expect(JSON.stringify(result)).not.toContain('tokenHash');
  });

  it('rejects login when the transactional session creation finds an inactive user', async () => {
    const { useCase, createdSessions } = setup(existingUser, true, false);

    await expect(
      useCase.execute({ email: existingUser.email, password: 'secret' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
    expect(createdSessions).toHaveLength(0);
  });

  it('accepts staff accounts and returns only safe staff user data', async () => {
    const staffUser: AuthUser = { ...existingUser, role: 'STAFF' };
    const { useCase } = setup(staffUser, true);

    const result = await useCase.execute({
      email: 'person@example.com',
      password: 'secret',
    });

    expect(result.user).toEqual({
      id: 'user-1',
      email: 'person@example.com',
      role: 'STAFF',
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('stored-password-hash');
    expect(JSON.stringify(result)).not.toContain('tokenHash');
  });
});
