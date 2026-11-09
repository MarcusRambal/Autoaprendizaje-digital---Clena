import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcrypt';

export interface DemoAccountDefinition {
  label: string;
  emailVariable: string;
  passwordVariable: string;
  role: UserRole;
}

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  role: UserRole;
}

/** One optional demo account per role, configured only through environment variables. */
export const DEMO_ACCOUNT_DEFINITIONS: readonly DemoAccountDefinition[] = [
  {
    label: 'admin',
    emailVariable: 'SEED_ADMIN_EMAIL',
    passwordVariable: 'SEED_ADMIN_PASSWORD',
    role: UserRole.ADMIN,
  },
  {
    label: 'staff',
    emailVariable: 'SEED_STAFF_EMAIL',
    passwordVariable: 'SEED_STAFF_PASSWORD',
    role: UserRole.STAFF,
  },
  {
    label: 'public user',
    emailVariable: 'SEED_USER_EMAIL',
    passwordVariable: 'SEED_USER_PASSWORD',
    role: UserRole.PUBLIC_USER,
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores everything past 72 bytes, so the registration form limits it too.
const PASSWORD_MAX_BYTES = 72;

/**
 * Reads the demo accounts from the environment, applying the same rules as the
 * registration form so a seeded account could also have been registered.
 */
export function resolveDemoAccounts(env: NodeJS.ProcessEnv): DemoAccount[] {
  const accounts: DemoAccount[] = [];

  for (const definition of DEMO_ACCOUNT_DEFINITIONS) {
    const email = env[definition.emailVariable]?.trim().toLowerCase();
    const password = env[definition.passwordVariable];

    if (!email && !password) {
      continue;
    }
    if (!email || !password) {
      throw new Error(
        `${definition.emailVariable} and ${definition.passwordVariable} must be provided together.`,
      );
    }
    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      throw new Error(`${definition.emailVariable} is not a valid email.`);
    }
    if (
      password.length < PASSWORD_MIN_LENGTH ||
      Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES
    ) {
      throw new Error(
        `${definition.passwordVariable} must have at least ${PASSWORD_MIN_LENGTH} characters and at most ${PASSWORD_MAX_BYTES} UTF-8 bytes.`,
      );
    }

    const duplicate = accounts.find((account) => account.email === email);
    if (duplicate) {
      throw new Error(
        `${definition.emailVariable} repeats the email of the ${duplicate.label} demo account; each role needs its own email.`,
      );
    }

    accounts.push({
      label: definition.label,
      email,
      password,
      role: definition.role,
    });
  }

  return accounts;
}

/** Creates or refreshes the demo accounts. Safe to run repeatedly. */
export async function seedDemoAccounts(
  prisma: PrismaClient,
  accounts: readonly DemoAccount[],
  saltRounds: number,
): Promise<void> {
  for (const account of accounts) {
    const passwordHash = await hash(account.password, saltRounds);
    const data = {
      passwordHash,
      role: account.role,
      status: UserStatus.ACTIVE,
      privacyAcceptedAt: new Date(),
      privacyNoticeVersion: 'seed',
    };
    await prisma.user.upsert({
      where: { email: account.email },
      update: data,
      create: { email: account.email, ...data },
    });
  }
}
