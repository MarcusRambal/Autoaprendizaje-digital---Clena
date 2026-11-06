import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/database/prisma.service';
import { PrismaAuthRepository } from './prisma-auth.repository';

type QueryCall = [TemplateStringsArray, ...unknown[]];
type QueryMock = jest.Mock<Promise<unknown>, QueryCall>;

describe('PrismaAuthRepository', () => {
  function setup() {
    const tx = {
      refreshSession: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValue([{ status: 'ACTIVE' }]) as QueryMock,
    };
    const prismaMock: {
      user: { findUnique: jest.Mock; create: jest.Mock };
      refreshSession: {
        create: jest.Mock;
        findUnique: jest.Mock;
        updateMany: jest.Mock;
      };
      $transaction: jest.Mock;
    } = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshSession: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ userId: 'user-1' }),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(
        (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const prisma = prismaMock as unknown as PrismaService;
    return {
      repository: new PrismaAuthRepository(prisma),
      prisma,
      prismaMock,
      tx,
    };
  }

  it('normalizes email before lookup and insertion, reporting unique conflicts', async () => {
    const { repository, prisma } = setup();
    const user = {
      id: 'user-1',
      email: 'person@example.com',
      passwordHash: 'stored-hash',
      role: 'PUBLIC_USER',
      status: 'ACTIVE',
    };
    const userDelegate = prisma.user as unknown as {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    userDelegate.findUnique.mockResolvedValue(user);
    await repository.findUserByEmail('  Person@Example.COM ');
    expect(userDelegate.findUnique).toHaveBeenCalledWith({
      where: { email: 'person@example.com' },
    });

    userDelegate.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      repository.createUser({
        email: ' PERSON@Example.COM ',
        passwordHash: 'stored-hash',
        role: 'PUBLIC_USER',
      }),
    ).resolves.toEqual({ kind: 'duplicate' });
    expect(userDelegate.create).toHaveBeenCalledWith({
      data: {
        email: 'person@example.com',
        passwordHash: 'stored-hash',
        role: 'PUBLIC_USER',
      },
    });
  });

  it('creates a refresh session only after locking and confirming its user is active', async () => {
    const { repository, prismaMock, tx } = setup();
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const refreshSessions = tx.refreshSession;
    refreshSessions.create.mockResolvedValue({});
    await expect(
      repository.createRefreshSession({
        id: 'session-1',
        userId: 'user-1',
        familyId: 'family-1',
        tokenHash: 'sha256-hash',
        expiresAt,
      }),
    ).resolves.toBe(true);
    expect(refreshSessions.create).toHaveBeenCalledWith({
      data: {
        id: 'session-1',
        userId: 'user-1',
        familyId: 'family-1',
        tokenHash: 'sha256-hash',
        expiresAt,
      },
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw.mock.calls[0][0].join(' ')).toContain('FROM "User"');
    expect(tx.$queryRaw.mock.calls[0][0].join(' ')).toContain('FOR UPDATE');
    expect(tx.refreshSession.create).toHaveBeenCalled();
    expect(prismaMock.refreshSession.create).not.toHaveBeenCalled();
  });

  it('does not create a refresh session when the user is inactive in the lock transaction', async () => {
    const { repository, prismaMock, tx } = setup();
    tx.$queryRaw.mockResolvedValue([{ status: 'DISABLED' }]);

    await expect(
      repository.createRefreshSession({
        id: 'session-1',
        userId: 'user-1',
        familyId: 'family-1',
        tokenHash: 'sha256-hash',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      }),
    ).resolves.toBe(false);

    expect(tx.refreshSession.create).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('treats a failed conditional consume as replay and checks expiry atomically', async () => {
    const { repository, prismaMock, tx } = setup();
    const txRefresh = tx.refreshSession;
    tx.$queryRaw
      .mockResolvedValueOnce([{ status: 'ACTIVE' }])
      .mockResolvedValueOnce([
        {
          id: 'session-1',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'sha256-hash',
          revokedAt: null,
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        },
      ]);
    txRefresh.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.rotateRefreshSession({
        tokenHash: 'sha256-hash',
        expectedSessionId: 'session-1',
        expectedUserId: 'user-1',
        expectedFamilyId: 'family-1',
        consumedAt: new Date('2029-01-01T00:00:00.000Z'),
        nextSession: {
          id: 'session-2',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'next-hash',
          expiresAt: new Date('2030-02-01T00:00:00.000Z'),
        },
      }),
    ).resolves.toEqual({ kind: 'replayed' });
    expect(txRefresh.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'session-1',
        tokenHash: 'sha256-hash',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        expiresAt: { gt: new Date('2029-01-01T00:00:00.000Z') },
      },
      data: { revokedAt: new Date('2029-01-01T00:00:00.000Z') },
    });
    expect(txRefresh.create).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('rejects an expired session without consuming or creating a successor', async () => {
    const { repository, tx } = setup();
    const expiredAt = new Date('2029-01-01T00:00:00.000Z');
    tx.$queryRaw
      .mockResolvedValueOnce([{ status: 'ACTIVE' }])
      .mockResolvedValueOnce([
        {
          id: 'session-1',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'sha256-hash',
          revokedAt: null,
          expiresAt: expiredAt,
        },
      ]);

    await expect(
      repository.rotateRefreshSession({
        tokenHash: 'sha256-hash',
        expectedSessionId: 'session-1',
        expectedUserId: 'user-1',
        expectedFamilyId: 'family-1',
        consumedAt: expiredAt,
        nextSession: {
          id: 'session-2',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'next-hash',
          expiresAt: new Date('2030-02-01T00:00:00.000Z'),
        },
      }),
    ).resolves.toEqual({ kind: 'expired' });
    expect(tx.refreshSession.updateMany).not.toHaveBeenCalled();
    expect(tx.refreshSession.create).not.toHaveBeenCalled();
  });

  it('inserts the successor in the same serializable transaction after consuming', async () => {
    const { repository, prismaMock, tx } = setup();
    const consumedAt = new Date('2029-01-01T00:00:00.000Z');
    tx.$queryRaw
      .mockResolvedValueOnce([{ status: 'ACTIVE' }])
      .mockResolvedValueOnce([
        {
          id: 'session-1',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'sha256-hash',
          revokedAt: null,
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        },
      ]);
    tx.refreshSession.updateMany.mockResolvedValue({ count: 1 });
    tx.refreshSession.create.mockResolvedValue({});
    const nextSession = {
      id: 'session-2',
      userId: 'user-1',
      familyId: 'family-1',
      tokenHash: 'next-hash',
      expiresAt: new Date('2030-02-01T00:00:00.000Z'),
    };

    await expect(
      repository.rotateRefreshSession({
        tokenHash: 'sha256-hash',
        expectedSessionId: 'session-1',
        expectedUserId: 'user-1',
        expectedFamilyId: 'family-1',
        consumedAt,
        nextSession,
      }),
    ).resolves.toEqual({ kind: 'rotated' });
    expect(tx.refreshSession.create).toHaveBeenCalledWith({
      data: nextSession,
    });
    expect(prismaMock.refreshSession.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: 'sha256-hash' },
      select: { userId: true },
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw.mock.calls[0][0].join(' ')).toContain('FROM "User"');
    expect(tx.$queryRaw.mock.calls[0][0].join(' ')).toContain('FOR UPDATE');
    expect(tx.$queryRaw.mock.calls[1][0].join(' ')).toContain(
      'FROM "RefreshSession"',
    );
    expect(tx.$queryRaw.mock.calls[1][0].join(' ')).toContain('FOR UPDATE');
    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('revokes the family when an expired revoked token is replayed', async () => {
    const { repository, tx } = setup();
    tx.$queryRaw
      .mockResolvedValueOnce([{ status: 'ACTIVE' }])
      .mockResolvedValueOnce([
        {
          id: 'session-1',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'sha256-hash',
          revokedAt: new Date('2029-01-01T00:00:00.000Z'),
          expiresAt: new Date('2028-12-31T00:00:00.000Z'),
        },
      ]);
    tx.refreshSession.updateMany.mockResolvedValue({ count: 2 });
    const revokedAt = new Date('2029-02-01T00:00:00.000Z');

    await expect(
      repository.rotateRefreshSession({
        tokenHash: 'sha256-hash',
        expectedSessionId: 'session-1',
        expectedUserId: 'user-1',
        expectedFamilyId: 'family-1',
        consumedAt: revokedAt,
        nextSession: {
          id: 'session-2',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'next-hash',
          expiresAt: new Date('2030-02-01T00:00:00.000Z'),
        },
      }),
    ).resolves.toEqual({ kind: 'replayed' });
    expect(tx.refreshSession.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: { revokedAt },
    });
    expect(tx.refreshSession.create).not.toHaveBeenCalled();
  });

  it('revokes sessions and rejects when the user is inactive during rotation', async () => {
    const { repository, tx } = setup();
    tx.$queryRaw
      .mockResolvedValueOnce([{ status: 'DISABLED' }])
      .mockResolvedValueOnce([
        {
          id: 'session-1',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'sha256-hash',
          revokedAt: null,
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        },
      ]);
    tx.refreshSession.updateMany.mockResolvedValue({ count: 2 });
    const consumedAt = new Date('2029-01-01T00:00:00.000Z');

    await expect(
      repository.rotateRefreshSession({
        tokenHash: 'sha256-hash',
        expectedSessionId: 'session-1',
        expectedUserId: 'user-1',
        expectedFamilyId: 'family-1',
        consumedAt,
        nextSession: {
          id: 'session-2',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'next-hash',
          expiresAt: new Date('2030-02-01T00:00:00.000Z'),
        },
      }),
    ).resolves.toEqual({ kind: 'revoked' });
    expect(tx.refreshSession.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: { revokedAt: consumedAt },
    });
    expect(tx.refreshSession.create).not.toHaveBeenCalled();
  });

  it('revokes a family when serializable isolation reports a concurrent consume', async () => {
    const { repository, prismaMock } = setup();
    const revokedAt = new Date('2029-01-01T00:00:00.000Z');
    prismaMock.$transaction.mockRejectedValue({ code: 'P2034' });
    prismaMock.refreshSession.updateMany.mockResolvedValue({
      count: 2,
    });

    await expect(
      repository.rotateRefreshSession({
        tokenHash: 'sha256-hash',
        expectedSessionId: 'session-1',
        expectedUserId: 'user-1',
        expectedFamilyId: 'family-1',
        consumedAt: revokedAt,
        nextSession: {
          id: 'session-2',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'next-hash',
          expiresAt: new Date('2030-02-01T00:00:00.000Z'),
        },
      }),
    ).resolves.toEqual({ kind: 'replayed' });
    expect(prismaMock.refreshSession.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: { revokedAt },
    });
  });

  it('treats a raw-query serialization failure as a replay', async () => {
    const { repository, prismaMock, tx } = setup();
    const revokedAt = new Date('2029-01-01T00:00:00.000Z');
    tx.$queryRaw.mockRejectedValue({
      code: 'P2010',
      meta: { code: '40001' },
    });
    prismaMock.refreshSession.updateMany.mockResolvedValue({ count: 2 });

    await expect(
      repository.rotateRefreshSession({
        tokenHash: 'sha256-hash',
        expectedSessionId: 'session-1',
        expectedUserId: 'user-1',
        expectedFamilyId: 'family-1',
        consumedAt: revokedAt,
        nextSession: {
          id: 'session-2',
          userId: 'user-1',
          familyId: 'family-1',
          tokenHash: 'next-hash',
          expiresAt: new Date('2030-02-01T00:00:00.000Z'),
        },
      }),
    ).resolves.toEqual({ kind: 'replayed' });
    expect(prismaMock.refreshSession.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: { revokedAt },
    });
  });
});
