import { LessonContentInput } from '../domain/lesson';
import { LessonApplicationError } from './lesson-application.error';
import { parseLessonContent } from './lesson-input';

const validInput: LessonContentInput = {
  title: '  Seguridad digital  ',
  description: '  Aprende a proteger tus cuentas.  ',
  categoryId: '4a64d6be-5cf2-4c1f-901a-bc212e31dcb4',
  questions: [
    {
      prompt: '  ¿Qué contraseña es más segura?  ',
      choices: [' Opción A ', 'Opción B', 'Opción C', 'Opción D'],
      correctOptionIndex: 2,
      immediateFeedback: '  Combina varios tipos de caracteres.  ',
    },
  ],
};

describe('parseLessonContent', () => {
  it('trims and validates lesson and question content', () => {
    expect(parseLessonContent(validInput)).toEqual({
      ...validInput,
      title: 'Seguridad digital',
      description: 'Aprende a proteger tus cuentas.',
      questions: [
        {
          ...validInput.questions[0],
          prompt: '¿Qué contraseña es más segura?',
          choices: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          immediateFeedback: 'Combina varios tipos de caracteres.',
        },
      ],
    });
  });

  it('rejects repeated options because the answer is stored by option text', () => {
    expect(() =>
      parseLessonContent({
        ...validInput,
        questions: [
          {
            ...validInput.questions[0],
            choices: ['Igual', 'Igual', 'Otra', 'Cuarta'],
          },
        ],
      }),
    ).toThrow(LessonApplicationError);
  });

  it('requires feedback and one valid correct option index', () => {
    expect(() =>
      parseLessonContent({
        ...validInput,
        questions: [{ ...validInput.questions[0], immediateFeedback: ' ' }],
      }),
    ).toThrow(LessonApplicationError);
    expect(() =>
      parseLessonContent({
        ...validInput,
        questions: [{ ...validInput.questions[0], correctOptionIndex: 4 }],
      }),
    ).toThrow(LessonApplicationError);
  });

  it('limits a lesson to eight questions', () => {
    expect(() =>
      parseLessonContent({
        ...validInput,
        questions: Array.from({ length: 9 }, () => validInput.questions[0]),
      }),
    ).toThrow(LessonApplicationError);
  });
});
