import { DynamicModule } from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Writable } from 'node:stream';
import { Options } from 'pino-http';
import { PARAMS_PROVIDER_TOKEN, PinoLogger } from 'nestjs-pino';
import { LoggerModule } from '../../../src/shared/logging/logger.module';

class SessionCredentials {
  constructor(public readonly accessToken: string) {}
}

function createCaptureLogger() {
  const [pinoModule] = Reflect.getMetadata(
    MODULE_METADATA.IMPORTS,
    LoggerModule,
  ) as DynamicModule[];
  const paramsProvider = pinoModule.providers?.find(
    (provider) =>
      typeof provider === 'object' &&
      provider !== null &&
      'provide' in provider &&
      provider.provide === PARAMS_PROVIDER_TOKEN &&
      'useValue' in provider,
  ) as
    | {
        useValue: { pinoHttp: Options };
      }
    | undefined;
  const pinoOptions = paramsProvider?.useValue.pinoHttp;
  if (!pinoOptions) {
    throw new Error('LoggerModule Pino options are missing');
  }

  const logLines: string[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      logLines.push(chunk.toString());
      callback();
    },
  });
  const logger = new PinoLogger({
    pinoHttp: [{ ...pinoOptions, level: 'info' }, destination],
  });

  return { logger, logLines };
}

const { logger, logLines } = createCaptureLogger();

describe('LoggerModule redaction', () => {
  beforeEach(() => {
    logLines.length = 0;
  });

  it('redacts sensitive fields nested more than two levels deep', () => {
    logger.info(
      {
        request: {
          auth: {
            session: new SessionCredentials('deeply-nested-secret'),
          },
        },
      },
      'request context',
    );

    const logOutput = logLines.join('');
    expect(logOutput).not.toContain('deeply-nested-secret');
    expect(logOutput).toContain('[REDACTED]');
  });

  it('redacts sensitive values in deeply nested child bindings', () => {
    const child = logger.logger.child({
      request: {
        auth: {
          session: new SessionCredentials('child-binding-secret'),
        },
      },
    });

    child.info('child context');

    const logOutput = logLines.join('');
    expect(logOutput).not.toContain('child-binding-secret');
    expect(logOutput).toContain('[REDACTED]');
  });
});
