import { PrismaService } from '../../../shared/database/prisma.service';
import { PrismaUserRepository } from './prisma-user.repository';

describe('PrismaUserRepository', () => {
  function setup(userRow: unknown = null) {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue(userRow),
        update: jest.fn(),
      },
      refreshSession: { updateMany: jest.fn() },
    };
    const prismaMock: {
      user: { findUnique: jest.Mock };
      $transaction: jest.Mock;
    } = {
      user: { findUnique: jest.fn().mockResolvedValue(userRow) },
      $transaction: jest.fn(
        (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const prisma = prismaMock as unknown as PrismaService;
    return {
      repository: new PrismaUserRepository(prisma),
      prisma,
      prismaMock,
      tx,
    };
  }

  it('maps a user lookup without exposing credential fields', async () => {
    const user = {
      id: 'user-1',
      email: 'person@example.com',
      passwordHash: 'secret-hash',
      role: 'STAFF',
      status: 'ACTIVE',
    };
    const { repository, prismaMock } = setup(user);

    await expect(repository.findById('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'person@example.com',
      role: 'STAFF',
      status: 'ACTIVE',
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it.each(['DISABLED', 'ARCHIVED'] as const)(
    'revokes active sessions in the same transaction when status becomes %s',
    async (status) => {
      const user = {
        id: 'user-1',
        email: 'person@example.com',
        role: 'PUBLIC_USER',
        status,
      };
      const { repository, prismaMock, tx } = setup(user);
      const operationOrder: string[] = [];
      tx.user.update.mockImplementation(() => {
        operationOrder.push('lock-and-update-user');
        return Promise.resolve(user);
      });
      tx.refreshSession.updateMany.mockImplementation(() => {
        operationOrder.push('revoke-sessions');
        return Promise.resolve({ count: 2 });
      });

      await expect(
        repository.updateStatus(
          'user-1',
          status,
          new Date('2029-01-01T00:00:00.000Z'),
        ),
      ).resolves.toMatchObject({ kind: 'updated', user });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(operationOrder).toEqual([
        'lock-and-update-user',
        'revoke-sessions',
      ]);
      expect(tx.refreshSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revokedAt: null,
          expiresAt: { gt: new Date('2029-01-01T00:00:00.000Z') },
        },
        data: { revokedAt: new Date('2029-01-01T00:00:00.000Z') },
      });
    },
  );

  it('does not revoke sessions when status becomes ACTIVE', async () => {
    const user = {
      id: 'user-1',
      email: 'person@example.com',
      role: 'PUBLIC_USER',
      status: 'ACTIVE',
    };
    const { repository, tx } = setup(user);
    tx.user.update.mockResolvedValue(user);

    await repository.updateStatus(
      'user-1',
      'ACTIVE',
      new Date('2029-01-01T00:00:00.000Z'),
    );

    expect(tx.refreshSession.updateMany).not.toHaveBeenCalled();
  });
});
