import { ApplicationError } from '../../../shared/errors/application-error';

export type AuthApplicationErrorCode =
  | 'INVALID_AUTH_INPUT'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'WEAK_PASSWORD';

export type AuthApplicationErrorStatus = 400 | 401 | 409 | 500;

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
