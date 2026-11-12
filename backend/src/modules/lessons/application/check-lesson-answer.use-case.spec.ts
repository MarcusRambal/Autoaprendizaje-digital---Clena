import { CheckLessonAnswerUseCase } from './check-lesson-answer.use-case';
import { LessonRepository } from '../domain/lesson.repository';

describe('CheckLessonAnswerUseCase', () => {
  const lesson = {
    id: 'lesson-id',
    title: 'Navegación segura',
    description: 'Aprende a navegar con seguridad.',
    categoryId: null,
    categoryTitle: null,
    publicationState: 'PUBLISHED' as const,
    questions: [
      {
        id: 'question-id',
        orderNumber: 1,
        prompt: '¿Qué debes comprobar?',
        choices: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 2,
        immediateFeedback: 'Verifica el origen antes de continuar.',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createUseCase = (publishedLesson: typeof lesson | null = lesson) => {
    const findPublishedById = jest.fn().mockResolvedValue(publishedLesson);
    return {
      useCase: new CheckLessonAnswerUseCase({
        findPublishedById,
      } as unknown as LessonRepository),
      findPublishedById,
    };
  };

  it('returns correctness and feedback for a correct answer without the answer key', async () => {
    const { useCase, findPublishedById } = createUseCase();

    await expect(
      useCase.execute('lesson-id', {
        questionId: 'question-id',
        selectedOptionIndex: 2,
      }),
    ).resolves.toEqual({
      correct: true,
      immediateFeedback: 'Verifica el origen antes de continuar.',
    });
    expect(findPublishedById).toHaveBeenCalledWith('lesson-id');
  });

  it('returns incorrect with the same feedback for a wrong answer', async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute('lesson-id', {
        questionId: 'question-id',
        selectedOptionIndex: 0,
      }),
    ).resolves.toEqual({
      correct: false,
      immediateFeedback: 'Verifica el origen antes de continuar.',
    });
  });

  it('rejects a question that does not belong to the lesson', async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute('lesson-id', {
        questionId: 'other-question',
        selectedOptionIndex: 0,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'QUESTION_NOT_FOUND',
    });
  });

  it('rejects an option outside the question choices', async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute('lesson-id', {
        questionId: 'question-id',
        selectedOptionIndex: 4,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_ANSWER',
    });
  });

  it('rejects a lesson that is not published or does not exist', async () => {
    const { useCase } = createUseCase(null);

    await expect(
      useCase.execute('lesson-id', {
        questionId: 'question-id',
        selectedOptionIndex: 0,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'LESSON_NOT_FOUND',
    });
  });
});
