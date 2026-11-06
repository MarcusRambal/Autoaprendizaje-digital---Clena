import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ApiError } from '../../../src/shared/errors/api-error';
import { ApplicationError } from '../../../src/shared/errors/application-error';
import { GlobalExceptionFilter } from '../../../src/shared/errors/global-exception.filter';

function createHttpHost(url: string) {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const request = { url };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('GlobalExceptionFilter', () => {
  it('preserves expected HTTP status and API error details', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHttpHost('/api/v1/example');

    filter.catch(
      new ApiError(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', 'Invalid input'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_INPUT',
        message: 'Invalid input',
        path: '/api/v1/example',
      }),
    );
  });

  it('maps unexpected errors to a stack-free 500 envelope', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHttpHost('/api/v1/example');

    filter.catch(new Error('database secret'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        path: '/api/v1/example',
      }),
    );
    const calls = response.json.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    const body = calls[0][0];
    expect(JSON.stringify(body)).not.toContain('database secret');
    expect(body).not.toHaveProperty('stack');
  });

  const applicationErrors: Array<[400 | 401 | 409, string, string]> = [
    [400, 'INVALID_AUTH_INPUT', 'Email and password are required'],
    [401, 'INVALID_CREDENTIALS', 'Invalid email or password'],
    [409, 'EMAIL_ALREADY_REGISTERED', 'Email already registered'],
  ];

  it.each(applicationErrors)(
    'maps typed application errors to the public %i response',
    (status, code, message) => {
      const filter = new GlobalExceptionFilter();
      const { host, response } = createHttpHost('/api/v1/auth');

      filter.catch(new ApplicationError(status, code, message), host);
      expect(response.status).toHaveBeenCalledWith(status);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: status, code, message }),
      );
    },
  );
});
