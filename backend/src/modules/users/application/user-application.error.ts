import { ApplicationError } from '../../../shared/errors/application-error';

export type UserApplicationErrorCode =
  | 'USER_NOT_FOUND'
  | 'ADMIN_ACCOUNT_PROTECTED'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_ROLE'
  | 'INVALID_USER_INPUT'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD';

export type UserApplicationErrorStatus = 400 | 404 | 409;

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
