export type ApplicationErrorStatus = 400 | 401 | 409;

export class ApplicationError extends Error {
  constructor(
    public readonly statusCode: ApplicationErrorStatus,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
