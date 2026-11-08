export class WeakPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeakPasswordError';
  }
}

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX_UTF8_BYTES = 72;

export function validatePassword(raw: string): void {
  if (typeof raw !== 'string') {
    throw new WeakPasswordError('Password must be a string');
  }
  if (raw.length < PASSWORD_MIN) {
    throw new WeakPasswordError(
      `Password must be at least ${PASSWORD_MIN} characters`,
    );
  }
  if (Buffer.byteLength(raw, 'utf8') > PASSWORD_MAX_UTF8_BYTES) {
    throw new WeakPasswordError(
      `Password must be at most ${PASSWORD_MAX_UTF8_BYTES} UTF-8 bytes`,
    );
  }
}
