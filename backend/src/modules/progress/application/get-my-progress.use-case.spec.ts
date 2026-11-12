import { ProgressRepository } from '../domain/progress.repository';
import { GetMyProgressUseCase } from './get-my-progress.use-case';

describe('GetMyProgressUseCase', () => {
  it('returns named completed and pending activities with percentages', async () => {
    const activities = {
      guides: [
        { id: 'guide-1', title: 'Guía leída', completed: true },
        { id: 'guide-2', title: 'Guía pendiente', completed: false },
        { id: 'guide-3', title: 'Otra guía pendiente', completed: false },
      ],
      lessons: [
        { id: 'lesson-1', title: 'Lección completada', completed: true },
        { id: 'lesson-2', title: 'Otra lección completada', completed: true },
        { id: 'lesson-3', title: 'Lección pendiente', completed: false },
        { id: 'lesson-4', title: 'Otra lección pendiente', completed: false },
      ],
    };
    const getActivities = jest.fn().mockResolvedValue(activities);
    const repository: ProgressRepository = {
      getActivities,
      markGuideRead: jest.fn(),
      markLessonCompleted: jest.fn(),
    };
    const useCase = new GetMyProgressUseCase(repository);

    await expect(useCase.execute('user-id')).resolves.toEqual({
      guides: {
        completed: 1,
        total: 3,
        percentage: 33,
        activities: activities.guides,
      },
      lessons: {
        completed: 2,
        total: 4,
        percentage: 50,
        activities: activities.lessons,
      },
    });
    expect(getActivities.mock.calls).toEqual([['user-id']]);
  });

  it('returns zero percent when there are no published items', async () => {
    const repository: ProgressRepository = {
      getActivities: jest.fn().mockResolvedValue({
        guides: [],
        lessons: [],
      }),
      markGuideRead: jest.fn(),
      markLessonCompleted: jest.fn(),
    };
    const useCase = new GetMyProgressUseCase(repository);

    await expect(useCase.execute('user-id')).resolves.toEqual({
      guides: { completed: 0, total: 0, percentage: 0, activities: [] },
      lessons: { completed: 0, total: 0, percentage: 0, activities: [] },
    });
  });
});
