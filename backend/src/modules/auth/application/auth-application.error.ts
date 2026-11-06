import { ApplicationError } from '../../../shared/errors/application-error';

export type AuthApplicationErrorCode =
  | 'INVALID_AUTH_INPUT'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN';

export type AuthApplicationErrorStatus = 400 | 401 | 409;

export class AuthApplicationError extends ApplicationError {
  constructor(
    statusCode: AuthApplicationErrorStatus,
    code: AuthApplicationErrorCode,
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'AuthApplicationError';
  }
}
