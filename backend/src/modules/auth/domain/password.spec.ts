import { validatePassword, WeakPasswordError } from './password';

describe('validatePassword', () => {
  it('requires at least eight characters', () => {
    expect(() => validatePassword('12345678')).not.toThrow();
    expect(() => validatePassword('1234567')).toThrow(WeakPasswordError);
  });

  it('enforces bcrypt’s 72-byte UTF-8 limit', () => {
    expect(() => validatePassword('😀'.repeat(18))).not.toThrow();
    expect(() => validatePassword('😀'.repeat(19))).toThrow(WeakPasswordError);
  });
});
