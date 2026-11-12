import { ProgressRepository } from '../domain/progress.repository';
import { GetMyProgressUseCase } from './get-my-progress.use-case';

describe('GetMyProgressUseCase', () => {
  it('returns completed and published totals as percentages', async () => {
    const getCounts = jest.fn().mockResolvedValue({
      completedGuides: 1,
      totalGuides: 3,
      completedLessons: 2,
      totalLessons: 4,
    });
    const repository: ProgressRepository = {
      getCounts,
      markGuideRead: jest.fn(),
      markLessonCompleted: jest.fn(),
    };
    const useCase = new GetMyProgressUseCase(repository);

    await expect(useCase.execute('user-id')).resolves.toEqual({
      guides: { completed: 1, total: 3, percentage: 33 },
      lessons: { completed: 2, total: 4, percentage: 50 },
    });
    expect(getCounts.mock.calls).toEqual([['user-id']]);
  });

  it('returns zero percent when there are no published items', async () => {
    const repository: ProgressRepository = {
      getCounts: jest.fn().mockResolvedValue({
        completedGuides: 0,
        totalGuides: 0,
        completedLessons: 0,
        totalLessons: 0,
      }),
      markGuideRead: jest.fn(),
      markLessonCompleted: jest.fn(),
    };
    const useCase = new GetMyProgressUseCase(repository);

    await expect(useCase.execute('user-id')).resolves.toEqual({
      guides: { completed: 0, total: 0, percentage: 0 },
      lessons: { completed: 0, total: 0, percentage: 0 },
    });
  });
});
