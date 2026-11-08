import {
  DeleteAccountResult,
  UserAccountRepository,
} from '../domain/user-account.repository';
import { DeleteUserAccountUseCase } from './delete-user-account.use-case';

type FoundUser = Awaited<ReturnType<UserAccountRepository['findById']>>;

function setup(
  user: FoundUser,
  result: DeleteAccountResult = { kind: 'deleted' },
) {
  const deleted: string[] = [];
  const repository = {
    findById: () => Promise.resolve(user),
    deleteAccount: (id: string) => {
      deleted.push(id);
      return Promise.resolve(result);
    },
  } as unknown as UserAccountRepository;
  return { useCase: new DeleteUserAccountUseCase(repository), deleted };
}

const user = (role: 'PUBLIC_USER' | 'STAFF' | 'ADMIN') =>
  ({ id: 'user-1', email: 'a@b.co', role, status: 'ACTIVE' }) as FoundUser;

describe('DeleteUserAccountUseCase', () => {
  it.each(['PUBLIC_USER', 'STAFF'] as const)(
    'erases the account of a %s',
    async (role) => {
      const { useCase, deleted } = setup(user(role));

      await expect(useCase.execute('user-1')).resolves.toBeUndefined();
      expect(deleted).toEqual(['user-1']);
    },
  );

  it('fails with 404 when the user does not exist', async () => {
    const { useCase, deleted } = setup(null);

    await expect(useCase.execute('missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
    expect(deleted).toHaveLength(0);
  });

  it('protects administrator accounts', async () => {
    const { useCase, deleted } = setup(user('ADMIN'));

    await expect(useCase.execute('user-1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'ADMIN_ACCOUNT_PROTECTED',
    });
    expect(deleted).toHaveLength(0);
  });

  it('fails with 404 when the account disappears during the delete', async () => {
    const { useCase } = setup(user('PUBLIC_USER'), { kind: 'not-found' });

    await expect(useCase.execute('user-1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });
});
