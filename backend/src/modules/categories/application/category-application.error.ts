import { ApplicationError } from '../../../shared/errors/application-error';

export type CategoryApplicationErrorCode =
  | 'INVALID_CATEGORY'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_ALREADY_EXISTS'
  | 'CATEGORY_IN_USE';

export type CategoryApplicationErrorStatus = 400 | 404 | 409;

export class CategoryApplicationError extends ApplicationError {
  constructor(
    statusCode: CategoryApplicationErrorStatus,
    code: CategoryApplicationErrorCode,
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'CategoryApplicationError';
  }
}
