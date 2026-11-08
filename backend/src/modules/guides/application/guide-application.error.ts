import { ApplicationError } from '../../../shared/errors/application-error';

export type GuideApplicationErrorCode =
  | 'INVALID_GUIDE'
  | 'INVALID_GUIDE_FILE'
  | 'GUIDE_NOT_FOUND'
  | 'GUIDE_FILE_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND';

export type GuideApplicationErrorStatus = 400 | 404;

export class GuideApplicationError extends ApplicationError {
  constructor(
    statusCode: GuideApplicationErrorStatus,
    code: GuideApplicationErrorCode,
    message: string,
  ) {
    super(statusCode, code, message);
    this.name = 'GuideApplicationError';
  }
}
