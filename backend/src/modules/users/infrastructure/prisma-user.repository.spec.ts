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

  it('creates users without selecting credential fields', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'person@example.com',
      role: 'STAFF',
      status: 'ACTIVE',
    });
    const prisma = {
      user: { create },
    } as unknown as PrismaService;
    const repository = new PrismaUserRepository(prisma);

    await expect(
      repository.createWithRole({
        email: 'person@example.com',
        passwordHash: 'hashed-password',
        role: 'STAFF',
      }),
    ).resolves.toEqual({
      kind: 'created',
      user: {
        id: 'user-1',
        email: 'person@example.com',
        role: 'STAFF',
        status: 'ACTIVE',
      },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        email: 'person@example.com',
        passwordHash: 'hashed-password',
        role: 'STAFF',
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });
  });

  it('maps Prisma unique-constraint errors to duplicate results', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const prisma = {
      user: { create },
    } as unknown as PrismaService;
    const repository = new PrismaUserRepository(prisma);

    await expect(
      repository.createWithRole({
        email: 'person@example.com',
        passwordHash: 'hashed-password',
        role: 'PUBLIC_USER',
      }),
    ).resolves.toEqual({ kind: 'duplicate' });
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

describe('PrismaUserRepository.list', () => {
  const createdAt = new Date('2026-11-09T10:00:00.000Z');

  function setup() {
    const prismaMock = {
      user: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user-1',
            email: 'ana@example.com',
            role: 'STAFF',
            status: 'ACTIVE',
            createdAt,
          },
        ]),
      },
      $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
    };
    return {
      repository: new PrismaUserRepository(
        prismaMock as unknown as PrismaService,
      ),
      prismaMock,
    };
  }

  it('pages without filters and never selects the password hash', async () => {
    const { repository, prismaMock } = setup();

    await expect(
      repository.list({ page: 3, pageSize: 10, order: 'asc' }),
    ).resolves.toEqual({
      items: [
        {
          id: 'user-1',
          email: 'ana@example.com',
          role: 'STAFF',
          status: 'ACTIVE',
          createdAt,
        },
      ],
      total: 2,
    });

    expect(prismaMock.user.count).toHaveBeenCalledWith({ where: {} });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {},
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ email: 'asc' }, { id: 'asc' }],
      skip: 20,
      take: 10,
    });
  });

  it('filters by role and by a case-insensitive email fragment', async () => {
    const { repository, prismaMock } = setup();

    await repository.list({
      page: 1,
      pageSize: 20,
      order: 'desc',
      role: 'PUBLIC_USER',
      search: 'ANA',
    });

    const where = {
      role: 'PUBLIC_USER',
      email: { contains: 'ANA', mode: 'insensitive' },
    };
    expect(prismaMock.user.count).toHaveBeenCalledWith({ where });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        orderBy: [{ email: 'desc' }, { id: 'desc' }],
      }),
    );
  });
});
