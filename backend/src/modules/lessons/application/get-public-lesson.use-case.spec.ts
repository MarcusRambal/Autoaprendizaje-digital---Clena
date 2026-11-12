import { GetPublicLessonUseCase } from './get-public-lesson.use-case';
import { LessonApplicationError } from './lesson-application.error';
import { LessonRepository } from '../domain/lesson.repository';

describe('GetPublicLessonUseCase', () => {
  const lesson = {
    id: 'lesson-id',
    title: 'Navegación segura',
    description: 'Aprende a navegar con seguridad.',
    categoryId: null,
    categoryTitle: null,
    publicationState: 'PUBLISHED' as const,
    questions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('returns a published lesson', async () => {
    const findPublishedById = jest.fn().mockResolvedValue(lesson);
    const useCase = new GetPublicLessonUseCase({
      findPublishedById,
    } as unknown as LessonRepository);

    await expect(useCase.execute(lesson.id)).resolves.toBe(lesson);
    expect(findPublishedById).toHaveBeenCalledWith(lesson.id);
  });

  it('reports a missing or unpublished lesson', async () => {
    const useCase = new GetPublicLessonUseCase({
      findPublishedById: jest.fn().mockResolvedValue(null),
    } as unknown as LessonRepository);

    await expect(useCase.execute('missing-id')).rejects.toMatchObject({
      statusCode: 404,
      code: 'LESSON_NOT_FOUND',
    } satisfies Partial<LessonApplicationError>);
  });
});
