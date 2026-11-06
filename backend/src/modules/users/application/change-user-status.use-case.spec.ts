import { UserStatusRepository } from '../domain/user-status.repository';
import { ChangeUserStatusUseCase } from './change-user-status.use-case';

describe('ChangeUserStatusUseCase', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(['DISABLED', 'ARCHIVED'] as const)(
    'changes the user status to %s',
    async (status) => {
      const updateStatus = jest.fn().mockResolvedValue({
        kind: 'updated',
        user: {
          id: 'user-1',
          email: 'person@example.com',
          role: 'PUBLIC_USER',
          status,
        },
      });
      const repository: UserStatusRepository = {
        findById: jest.fn().mockResolvedValue(null),
        updateStatus,
      };
      const useCase = new ChangeUserStatusUseCase(
        repository,
        () => new Date('2029-01-01T00:00:00.000Z'),
      );

      await expect(
        useCase.execute({ userId: 'user-1', status }),
      ).resolves.toEqual({
        kind: 'updated',
        user: {
          id: 'user-1',
          email: 'person@example.com',
          role: 'PUBLIC_USER',
          status,
        },
      });
      expect(updateStatus).toHaveBeenCalledWith(
        'user-1',
        status,
        new Date('2029-01-01T00:00:00.000Z'),
      );
    },
  );

  it('reports a missing user without changing a status', async () => {
    const updateStatus = jest.fn().mockResolvedValue({ kind: 'not-found' });
    const useCase = new ChangeUserStatusUseCase(
      { findById: jest.fn().mockResolvedValue(null), updateStatus },
      () => new Date('2029-01-01T00:00:00.000Z'),
    );

    await expect(
      useCase.execute({ userId: 'missing', status: 'DISABLED' }),
    ).resolves.toEqual({ kind: 'not-found' });
  });

  it('uses the current time when no clock is provided', async () => {
    const now = new Date('2029-01-02T03:04:05.000Z');
    jest.useFakeTimers().setSystemTime(now);
    const updateStatus = jest.fn().mockResolvedValue({ kind: 'not-found' });
    const useCase = new ChangeUserStatusUseCase({
      findById: jest.fn().mockResolvedValue(null),
      updateStatus,
    });

    await useCase.execute({ userId: 'user-1', status: 'DISABLED' });

    expect(updateStatus).toHaveBeenCalledWith('user-1', 'DISABLED', now);
  });
});
