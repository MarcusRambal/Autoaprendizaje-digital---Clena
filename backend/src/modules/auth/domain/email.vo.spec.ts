import { Email, InvalidEmailError } from './email.vo';

describe('Email', () => {
  it('trims and lowercases the address', () => {
    const email = Email.create('  Ana.Lopez@Example.COM ');

    expect(email.value).toBe('ana.lopez@example.com');
    expect(email.toString()).toBe('ana.lopez@example.com');
  });

  it.each([
    '',
    'sin-arroba.com',
    'a@b',
    'con espacio@example.com',
    '@example.com',
    'ana@@example.com',
  ])('rejects the invalid address %p', (raw) => {
    expect(() => Email.create(raw)).toThrow(
      new InvalidEmailError('Email format is invalid'),
    );
  });

  it('rejects values that are not strings', () => {
    expect(() => Email.create(42 as unknown as string)).toThrow(
      new InvalidEmailError('Email must be a string'),
    );
  });
});

describe('InvalidEmailError', () => {
  it('has a default message and a recognizable name', () => {
    const error = new InvalidEmailError();

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Invalid email');
    expect(error.name).toBe('InvalidEmailError');
  });
});
