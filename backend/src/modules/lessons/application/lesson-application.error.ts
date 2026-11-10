import { ApplicationError } from '../../../shared/errors/application-error';

export type LessonApplicationErrorCode =
  | 'INVALID_LESSON'
  | 'LESSON_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'LESSON_HAS_PROGRESS'
  | 'LESSON_QUESTIONS_LOCKED';

export type LessonApplicationErrorStatus = 400 | 404 | 409;

export class LessonApplicationError extends ApplicationError {
  constructor(
    statusCode: LessonApplicationErrorStatus,
    code: LessonApplicationErrorCode,
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'LessonApplicationError';
  }
}
