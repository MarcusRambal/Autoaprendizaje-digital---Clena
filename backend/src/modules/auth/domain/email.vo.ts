// domain/email.vo.ts

export class InvalidEmailError extends Error {
  constructor(message = 'Invalid email') {
    super(message);
    this.name = 'InvalidEmailError';
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    if (typeof raw !== 'string') {
      throw new InvalidEmailError('Email must be a string');
    }
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      throw new InvalidEmailError('Email format is invalid');
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }
}
