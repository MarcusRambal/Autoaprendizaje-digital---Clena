import { CredentialHasher } from '../../auth/domain/credential-hasher.port';
import {
  CreateAccountResult,
  CreatedUser,
  UserAccountRepository,
} from '../domain/user-account.repository';
import { CreateUserUseCase } from './create-user.use-case';

const user: CreatedUser = {
  id: 'user-1',
  email: 'person@example.com',
  role: 'STAFF',
  status: 'ACTIVE',
};

function setup(result: CreateAccountResult = { kind: 'created', user }) {
  const createInputs: Parameters<UserAccountRepository['createWithRole']>[0][] =
    [];
  const hashInputs: string[] = [];
  const repository: UserAccountRepository = {
    findById: () => Promise.resolve(null),
    deleteAccount: () => Promise.resolve({ kind: 'deleted' }),
    createWithRole: (input) => {
      createInputs.push(input);
      return Promise.resolve(result);
    },
  };
  const credentialHasher: CredentialHasher = {
    hash: (plainText) => {
      hashInputs.push(plainText);
      return Promise.resolve('hashed-password');
    },
    verify: () => Promise.resolve(false),
  };
  return {
    useCase: new CreateUserUseCase(repository, credentialHasher),
    createInputs,
    hashInputs,
  };
}

describe('CreateUserUseCase', () => {
  it('normalizes email, hashes once, and returns a user without the hash', async () => {
    const { useCase, createInputs, hashInputs } = setup();

    const result = await useCase.execute({
      email: '  PERSON@EXAMPLE.COM ',
      password: 'secure-password',
      role: 'STAFF',
    });

    expect(createInputs).toEqual([
      {
        email: 'person@example.com',
        passwordHash: 'hashed-password',
        role: 'STAFF',
      },
    ]);
    expect(hashInputs).toEqual(['secure-password']);
    expect(result).toEqual(user);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects ADMIN as a creatable role', async () => {
    const { useCase, createInputs, hashInputs } = setup();

    await expect(
      useCase.execute({
        email: 'person@example.com',
        password: 'secure-password',
        role: 'ADMIN',
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_ROLE' });
    expect(createInputs).toHaveLength(0);
    expect(hashInputs).toHaveLength(0);
  });

  it('maps a duplicate email to a 409 application error', async () => {
    const { useCase } = setup({ kind: 'duplicate' });

    await expect(
      useCase.execute({
        email: 'person@example.com',
        password: 'secure-password',
        role: 'PUBLIC_USER',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'Email already registered',
    });
  });

  it('rejects a weak password with 400 before hashing or persistence', async () => {
    const { useCase, createInputs, hashInputs } = setup();

    await expect(
      useCase.execute({
        email: 'person@example.com',
        password: 'weak',
        role: 'PUBLIC_USER',
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'WEAK_PASSWORD' });
    expect(hashInputs).toHaveLength(0);
    expect(createInputs).toHaveLength(0);
  });
});
