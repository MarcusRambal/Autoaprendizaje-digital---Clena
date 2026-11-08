import { ApplicationError } from '../../../shared/errors/application-error';

export type HelpRequestApplicationErrorCode =
  'INVALID_HELP_REQUEST' | 'HELP_REQUEST_NOT_FOUND';

export type HelpRequestApplicationErrorStatus = 400 | 404;

export class HelpRequestApplicationError extends ApplicationError {
  constructor(
    statusCode: HelpRequestApplicationErrorStatus,
    code: HelpRequestApplicationErrorCode,
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'HelpRequestApplicationError';
  }
}
