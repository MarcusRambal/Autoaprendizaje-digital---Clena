import { AuthUser } from '../domain/auth-user';
import { AuthRepository } from '../domain/auth.repository';
import { CredentialHasher } from '../domain/credential-hasher.port';
import { RegisterUseCase } from './register.use-case';

const user = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  email: 'person@example.com',
  passwordHash: 'stored-password-hash',
  role: 'PUBLIC_USER',
  status: 'ACTIVE',
  ...overrides,
});

function setup(existing: AuthUser[] = [], duplicateOnCreate = false) {
  const created: AuthUser[] = [];
  const repository: AuthRepository = {
    findUserByEmail: (email) =>
      Promise.resolve(
        existing.find((candidate) => candidate.email === email) ?? null,
      ),
    createUser: (input) => {
      if (duplicateOnCreate) {
        return Promise.resolve({ kind: 'duplicate' });
      }
      const createdUser = user({ ...input, id: `user-${created.length + 1}` });
      created.push(createdUser);
      return Promise.resolve({ kind: 'created', user: createdUser });
    },
    findUserById: () => Promise.resolve(null),
    createRefreshSession: () => Promise.resolve(true),
    rotateRefreshSession: () => Promise.resolve({ kind: 'not-found' }),
    revokeRefreshSessionFamily: () => Promise.resolve(),
  };
  const hasher: CredentialHasher = {
    hash: (password) => Promise.resolve(`hashed:${password}`),
    verify: () => Promise.resolve(false),
  };
  return { useCase: new RegisterUseCase(repository, hasher), created };
}

describe('RegisterUseCase', () => {
  it('normalizes email, always assigns PUBLIC_USER, and returns a safe user', async () => {
    const { useCase, created } = setup();
    const result = await useCase.execute({
      email: '  Person@Example.COM  ',
      password: 'secret',
    });

    expect(created[0]).toMatchObject({
      email: 'person@example.com',
      passwordHash: 'hashed:secret',
      role: 'PUBLIC_USER',
    });
    expect(result).toEqual({
      id: 'user-1',
      email: 'person@example.com',
      role: 'PUBLIC_USER',
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(JSON.stringify(result)).not.toContain('hashed:secret');
  });

  it('rejects empty email or password as invalid input', async () => {
    const { useCase, created } = setup();

    await expect(
      useCase.execute({ email: '  ', password: 'secret' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_AUTH_INPUT',
    });
    await expect(
      useCase.execute({ email: 'person@example.com', password: '' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_AUTH_INPUT',
    });
    expect(created).toHaveLength(0);
  });

  it('ignores a caller-supplied role and reports duplicate normalized email as conflict', async () => {
    const { useCase, created } = setup([user()]);

    await expect(
      useCase.execute({
        email: ' PERSON@example.com ',
        password: 'secret',
        role: 'ADMIN',
      } as never),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    });
    expect(created).toHaveLength(0);
  });

  it('returns conflict when the repository detects a duplicate during insertion', async () => {
    const { useCase } = setup([], true);

    await expect(
      useCase.execute({ email: 'person@example.com', password: 'secret' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    });
  });
});
