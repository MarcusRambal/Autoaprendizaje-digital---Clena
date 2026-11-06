import { Module } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'node:http';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

const sensitiveFields = new Set([
  'password',
  'authorization',
  'accesstoken',
  'refreshtoken',
  'token',
]);
const redactedValue = '[REDACTED]';

function redactNestedFields(
  value: unknown,
  visited = new WeakMap<object, unknown>(),
): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const cached = visited.get(value);
  if (cached) {
    return cached;
  }

  if (value instanceof IncomingMessage || value instanceof ServerResponse) {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Buffer.isBuffer(value)) {
    return Buffer.from(value);
  }

  const isArray = Array.isArray(value);
  const isError = value instanceof Error;
  const redacted: object = isError
    ? new Error(value.message)
    : isArray
      ? []
      : {};
  visited.set(value, redacted);

  if (isError && redacted instanceof Error) {
    const redactedError = redacted;
    redactedError.name = value.name;
    redactedError.stack = value.stack;
    Object.setPrototypeOf(
      redactedError,
      Object.getPrototypeOf(value) as object,
    );

    if ('cause' in value) {
      const errorCause = (value as Error & { cause?: unknown }).cause;
      Object.defineProperty(redactedError, 'cause', {
        configurable: true,
        value: redactNestedFields(errorCause, visited),
      });
    }
  }

  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      !descriptor ||
      !('value' in descriptor) ||
      typeof descriptor.value === 'function'
    ) {
      continue;
    }

    const item = sensitiveFields.has(key.toLowerCase())
      ? redactedValue
      : redactNestedFields(descriptor.value, visited);
    Object.defineProperty(redacted, key, {
      configurable: true,
      enumerable: true,
      value: item,
      writable: true,
    });
  }

  return redacted;
}

const redactedFields = [
  'password',
  '*.password',
  '*.*.password',
  'authorization',
  '*.authorization',
  '*.*.authorization',
  'accessToken',
  '*.accessToken',
  '*.*.accessToken',
  'refreshToken',
  '*.refreshToken',
  '*.*.refreshToken',
  'token',
  '*.token',
  '*.*.token',
  'req.headers.authorization',
  'req.body.password',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.token',
];

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
        hooks: {
          logMethod(args, method) {
            method.apply(
              this,
              args.map((argument) => redactNestedFields(argument)),
            );
          },
          streamWrite(serializedLog) {
            try {
              return `${JSON.stringify(
                redactNestedFields(JSON.parse(serializedLog)),
              )}\n`;
            } catch {
              return `${JSON.stringify({
                level: 50,
                msg: 'Log redaction failed',
              })}\n`;
            }
          },
        },
        redact: {
          paths: redactedFields,
          censor: '[REDACTED]',
        },
      },
    }),
  ],
})
export class LoggerModule {}
