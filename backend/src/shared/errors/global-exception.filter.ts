import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from './application-error';
import { ApiError } from './api-error';

interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : exception instanceof ApplicationError
          ? exception.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      statusCode >= 500 &&
      !(exception instanceof ApiError) &&
      !(exception instanceof ApplicationError)
        ? 'Internal server error'
        : this.getMessage(exception);
    const code =
      exception instanceof ApiError
        ? exception.code
        : exception instanceof ApplicationError
          ? exception.code
          : statusCode === 500
            ? 'INTERNAL_SERVER_ERROR'
            : 'HTTP_ERROR';

    const body: ApiErrorResponse = {
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof ApplicationError) {
      return exception.message;
    }
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const message = (exceptionResponse as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return exception.message;
  }
}
