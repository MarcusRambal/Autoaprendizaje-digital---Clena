import { ApplicationError } from '../../../shared/errors/application-error';

export type UserApplicationErrorCode =
  'USER_NOT_FOUND' | 'ADMIN_ACCOUNT_PROTECTED';

export type UserApplicationErrorStatus = 404 | 409;

export class UserApplicationError extends ApplicationError {
  constructor(
    statusCode: UserApplicationErrorStatus,
    code: UserApplicationErrorCode,
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'UserApplicationError';
  }
}
