import {
  resolveDemoAccounts,
  resolveRequiredDemoAccounts,
} from '../../prisma/demo-accounts';

const full = {
  SEED_ADMIN_EMAIL: 'Admin@Demo.test ',
  SEED_ADMIN_PASSWORD: 'admin-password-1',
  SEED_STAFF_EMAIL: 'staff@demo.test',
  SEED_STAFF_PASSWORD: 'staff-password-1',
  SEED_USER_EMAIL: 'user@demo.test',
  SEED_USER_PASSWORD: 'user-password-1',
};

describe('resolveDemoAccounts', () => {
  it('creates no accounts when nothing is configured', () => {
    expect(resolveDemoAccounts({})).toEqual([]);
    expect(
      resolveDemoAccounts({ SEED_ADMIN_EMAIL: '', SEED_ADMIN_PASSWORD: '' }),
    ).toEqual([]);
  });

  describe('resolveRequiredDemoAccounts', () => {
    it('requires credentials for all three account roles', () => {
      expect(() => resolveRequiredDemoAccounts({})).toThrow(
        'The seed requires credentials for ADMIN, STAFF, and PUBLIC_USER.',
      );
      expect(() =>
        resolveRequiredDemoAccounts({
          SEED_ADMIN_EMAIL: 'admin@demo.test',
          SEED_ADMIN_PASSWORD: 'admin-password-1',
        }),
      ).toThrow('SEED_STAFF_EMAIL and SEED_STAFF_PASSWORD');
    });

    it('returns all configured demo roles', () => {
      expect(resolveRequiredDemoAccounts(full)).toHaveLength(3);
    });
  });

  it('maps each pair of variables to its role and normalizes the email', () => {
    expect(resolveDemoAccounts(full)).toEqual([
      {
        label: 'admin',
        email: 'admin@demo.test',
        password: 'admin-password-1',
        role: 'ADMIN',
      },
      {
        label: 'staff',
        email: 'staff@demo.test',
        password: 'staff-password-1',
        role: 'STAFF',
      },
      {
        label: 'public user',
        email: 'user@demo.test',
        password: 'user-password-1',
        role: 'PUBLIC_USER',
      },
    ]);
  });

  it('lets each account be configured independently', () => {
    const accounts = resolveDemoAccounts({
      SEED_STAFF_EMAIL: 'staff@demo.test',
      SEED_STAFF_PASSWORD: 'staff-password-1',
    });

    expect(accounts.map((account) => account.role)).toEqual(['STAFF']);
  });

  it.each([
    [
      'SEED_ADMIN_EMAIL',
      'SEED_ADMIN_PASSWORD',
      { SEED_ADMIN_PASSWORD: 'admin-password-1' },
    ],
    [
      'SEED_STAFF_EMAIL',
      'SEED_STAFF_PASSWORD',
      { SEED_STAFF_EMAIL: 'staff@demo.test' },
    ],
    [
      'SEED_USER_EMAIL',
      'SEED_USER_PASSWORD',
      { SEED_USER_PASSWORD: 'user-password-1' },
    ],
  ])('requires %s and %s together', (emailVariable, passwordVariable, env) => {
    expect(() => resolveDemoAccounts(env)).toThrow(
      `${emailVariable} and ${passwordVariable} must be provided together`,
    );
  });

  it.each([
    'not-an-email',
    'a@b',
    'with space@demo.test',
    `${'a'.repeat(250)}@x.co`,
  ])('rejects the invalid email %p', (email) => {
    expect(() =>
      resolveDemoAccounts({
        SEED_STAFF_EMAIL: email,
        SEED_STAFF_PASSWORD: 'staff-password-1',
      }),
    ).toThrow('SEED_STAFF_EMAIL is not a valid email');
  });

  it.each(['short', '1234567', 'ñ'.repeat(37)])(
    'rejects the password %p (under 8 characters or over 72 bytes)',
    (password) => {
      expect(() =>
        resolveDemoAccounts({
          SEED_USER_EMAIL: 'user@demo.test',
          SEED_USER_PASSWORD: password,
        }),
      ).toThrow('SEED_USER_PASSWORD must have at least 8 characters');
    },
  );

  it('accepts a password of exactly 72 bytes', () => {
    expect(
      resolveDemoAccounts({
        SEED_USER_EMAIL: 'user@demo.test',
        SEED_USER_PASSWORD: 'ñ'.repeat(36),
      }),
    ).toHaveLength(1);
  });

  it('rejects two roles sharing one email', () => {
    expect(() =>
      resolveDemoAccounts({
        ...full,
        SEED_USER_EMAIL: 'STAFF@demo.test',
      }),
    ).toThrow('SEED_USER_EMAIL repeats the email of the staff demo account');
  });
});
