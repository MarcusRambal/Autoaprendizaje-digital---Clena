import { ApplicationError } from '../../../shared/errors/application-error';

export class ProgressApplicationError extends ApplicationError {
  constructor(
    statusCode: 404,
    code: 'GUIDE_NOT_FOUND' | 'LESSON_NOT_FOUND',
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'ProgressApplicationError';
  }
}
