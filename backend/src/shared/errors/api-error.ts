import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiError extends HttpException {
  constructor(
    statusCode: HttpStatus,
    public readonly code: string,
    message: string,
  ) {
    super({ statusCode, code, message }, statusCode);
  }
}
