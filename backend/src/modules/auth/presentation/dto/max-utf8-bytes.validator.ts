import { registerDecorator, ValidationArguments } from 'class-validator';

export function MaxUtf8Bytes(maxBytes: number): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: 'maxUtf8Bytes',
      target: target.constructor,
      propertyName: propertyKey.toString(),
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'string' &&
            Buffer.byteLength(value, 'utf8') <= maxBytes
          );
        },
        defaultMessage(args?: ValidationArguments): string {
          return `${args?.property ?? 'Value'} must be at most ${maxBytes} UTF-8 bytes`;
        },
      },
    });
  };
}
