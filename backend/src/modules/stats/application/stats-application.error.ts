import { ApplicationError } from '../../../shared/errors/application-error';

export type StatsApplicationErrorCode =
  'INVALID_STATS_RANGE' | 'GUIDE_NOT_FOUND';

export type StatsApplicationErrorStatus = 400 | 404;

export class StatsApplicationError extends ApplicationError {
  constructor(
    statusCode: StatsApplicationErrorStatus,
    code: StatsApplicationErrorCode,
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'StatsApplicationError';
  }
}
