import { ListLessonsUseCase } from '../application/list-lessons.use-case';
import { GetPublicLessonUseCase } from '../application/get-public-lesson.use-case';
import { CheckLessonAnswerUseCase } from '../application/check-lesson-answer.use-case';
import { PublicLessonsController } from './public-lessons.controller';

describe('PublicLessonsController', () => {
  const lesson = {
    id: 'a72e2683-10a7-45f1-b7b7-7f3b2e09a225',
    title: 'Navegación segura',
    description: 'Aprende a navegar con seguridad.',
    categoryId: null,
    categoryTitle: 'Seguridad digital',
    publicationState: 'PUBLISHED' as const,
    questions: [
      {
        id: 'c5607e3f-a190-496c-9c2c-e667ad8812b5',
        orderNumber: 1,
        prompt: '¿Qué debes comprobar?',
        choices: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 2,
        immediateFeedback: 'Verifica el origen antes de continuar.',
      },
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const createController = () => {
    const execute = jest.fn().mockResolvedValue({
      items: [lesson],
      page: 2,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });
    const getOne = jest.fn().mockResolvedValue(lesson);
    const checkAnswer = jest.fn().mockResolvedValue({
      correct: true,
      immediateFeedback: 'Verifica el origen antes de continuar.',
    });
    const controller = new PublicLessonsController(
      { execute } as unknown as ListLessonsUseCase,
      { execute: getOne } as unknown as GetPublicLessonUseCase,
      { execute: checkAnswer } as unknown as CheckLessonAnswerUseCase,
    );
    return { controller, execute, getOne, checkAnswer };
  };

  it('only requests published lessons, regardless of client query', async () => {
    const { controller, execute } = createController();

    const result = await controller.list({
      page: 2,
      pageSize: 10,
      order: 'asc',
    });

    expect(execute).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      order: 'asc',
      publicationState: 'PUBLISHED',
    });
    expect(result.items).toEqual([
      {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        category: lesson.categoryTitle,
      },
    ]);
  });

  it('returns published lesson questions without answer keys', async () => {
    const { controller, getOne } = createController();
    const result = await controller.getOne(lesson.id);

    expect(getOne).toHaveBeenCalledWith(lesson.id);
    expect(result).toEqual({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      category: lesson.categoryTitle,
      questions: [
        {
          id: lesson.questions[0].id,
          orderNumber: 1,
          prompt: '¿Qué debes comprobar?',
          choices: ['A', 'B', 'C', 'D'],
        },
      ],
    });
    expect(result.questions[0]).not.toHaveProperty('correctOptionIndex');
    expect(result.questions[0]).not.toHaveProperty('immediateFeedback');
  });

  it('checks answers without returning the correct option index', async () => {
    const { controller, checkAnswer } = createController();
    const input = {
      questionId: lesson.questions[0].id,
      selectedOptionIndex: 2,
    };

    await expect(controller.checkAnswer(lesson.id, input)).resolves.toEqual({
      correct: true,
      immediateFeedback: 'Verifica el origen antes de continuar.',
    });
    expect(checkAnswer).toHaveBeenCalledWith(lesson.id, input);
  });
});
