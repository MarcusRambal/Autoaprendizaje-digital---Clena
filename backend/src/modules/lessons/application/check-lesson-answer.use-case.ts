import { LessonRepository } from '../domain/lesson.repository';
import { LessonApplicationError } from './lesson-application.error';

export interface CheckLessonAnswerInput {
  questionId: string;
  selectedOptionIndex: number;
}

export interface CheckLessonAnswerResult {
  correct: boolean;
  immediateFeedback: string;
}

export class CheckLessonAnswerUseCase {
  constructor(private readonly repository: LessonRepository) {}

  async execute(
    lessonId: string,
    input: CheckLessonAnswerInput,
  ): Promise<CheckLessonAnswerResult> {
    const lesson = await this.repository.findPublishedById(lessonId);
    if (!lesson) {
      throw new LessonApplicationError(
        404,
        'LESSON_NOT_FOUND',
        'Lesson not found',
      );
    }

    const question = lesson.questions.find(
      (item) => item.id === input.questionId,
    );
    if (!question) {
      throw new LessonApplicationError(
        404,
        'QUESTION_NOT_FOUND',
        'Question not found for this lesson',
      );
    }

    if (
      !Number.isInteger(input.selectedOptionIndex) ||
      input.selectedOptionIndex < 0 ||
      input.selectedOptionIndex >= question.choices.length
    ) {
      throw new LessonApplicationError(
        400,
        'INVALID_ANSWER',
        'Selected option is invalid',
      );
    }

    return {
      correct: input.selectedOptionIndex === question.correctOptionIndex,
      immediateFeedback: question.immediateFeedback,
    };
  }
}
