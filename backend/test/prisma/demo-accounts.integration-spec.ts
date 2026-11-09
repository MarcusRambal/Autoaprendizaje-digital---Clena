import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { randomUUID } from 'node:crypto';
import {
  resolveDemoAccounts,
  seedDemoAccounts,
} from '../../prisma/demo-accounts';

const prisma = new PrismaClient();
const run = randomUUID().slice(0, 8);
const email = (label: string) => `demo-${label}-${run}@example.com`;
const SALT_ROUNDS = 10;

const env = (passwordSuffix = 'one') => ({
  SEED_ADMIN_EMAIL: email('admin'),
  SEED_ADMIN_PASSWORD: `admin-pass-${passwordSuffix}`,
  SEED_STAFF_EMAIL: email('staff'),
  SEED_STAFF_PASSWORD: `staff-pass-${passwordSuffix}`,
  SEED_USER_EMAIL: email('user'),
  SEED_USER_PASSWORD: `user-pass-${passwordSuffix}`,
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: `-${run}@example.com` } },
  });
  await prisma.$disconnect();
});

describe('seedDemoAccounts (PostgreSQL)', () => {
  it('creates one active account per role with a hashed password and consent', async () => {
    await seedDemoAccounts(prisma, resolveDemoAccounts(env()), SALT_ROUNDS);

    const users = await prisma.user.findMany({
      where: { email: { endsWith: `-${run}@example.com` } },
      orderBy: { email: 'asc' },
    });

    expect(users.map((user) => [user.email, user.role, user.status])).toEqual([
      [email('admin'), 'ADMIN', 'ACTIVE'],
      [email('staff'), 'STAFF', 'ACTIVE'],
      [email('user'), 'PUBLIC_USER', 'ACTIVE'],
    ]);
    for (const user of users) {
      expect(user.passwordHash).not.toContain('pass');
      expect(user.privacyAcceptedAt).toBeInstanceOf(Date);
      expect(user.privacyNoticeVersion).toBe('seed');
    }
    expect(await compare('staff-pass-one', users[1].passwordHash)).toBe(true);
    expect(await compare('user-pass-one', users[2].passwordHash)).toBe(true);
  });

  it('is repeatable: it does not duplicate accounts and refreshes passwords and roles', async () => {
    await prisma.user.update({
      where: { email: email('staff') },
      data: { role: 'PUBLIC_USER', status: 'ARCHIVED' },
    });

    await seedDemoAccounts(
      prisma,
      resolveDemoAccounts(env('two')),
      SALT_ROUNDS,
    );

    expect(
      await prisma.user.count({
        where: { email: { endsWith: `-${run}@example.com` } },
      }),
    ).toBe(3);
    const staff = await prisma.user.findUniqueOrThrow({
      where: { email: email('staff') },
    });
    expect(staff).toMatchObject({ role: 'STAFF', status: 'ACTIVE' });
    expect(await compare('staff-pass-two', staff.passwordHash)).toBe(true);
    expect(await compare('staff-pass-one', staff.passwordHash)).toBe(false);
  });

  it('creates nothing when no account is configured', async () => {
    const before = await prisma.user.count();

    await seedDemoAccounts(prisma, [], SALT_ROUNDS);

    expect(await prisma.user.count()).toBe(before);
  });
});
