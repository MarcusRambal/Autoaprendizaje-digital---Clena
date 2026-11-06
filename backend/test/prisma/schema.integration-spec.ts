import { compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const expectedEnums: Record<string, string[]> = {
  ActivityProgressStatus: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
  PublicationState: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  UserRole: ['ADMIN', 'STAFF', 'PUBLIC_USER'],
  UserStatus: ['ACTIVE', 'DISABLED', 'ARCHIVED'],
};

describe('PostgreSQL schema and demo seed', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deploys all application tables, enums, indexes, and foreign keys', async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    expect(tables.map(({ table_name }) => table_name)).toEqual(
      expect.arrayContaining([
        '_prisma_migrations',
        'Activity',
        'ActivityProgress',
        'ActivityQuestion',
        'Category',
        'Guide',
        'GuideStep',
        'RefreshSession',
        'User',
      ]),
    );

    const enumRows = await prisma.$queryRaw<
      { type_name: string; enum_label: string }[]
    >`
      SELECT t.typname AS type_name, e.enumlabel AS enum_label
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `;
    const enums = enumRows.reduce<Record<string, string[]>>(
      (result, { type_name, enum_label }) => {
        result[type_name] ??= [];
        result[type_name].push(enum_label);
        return result;
      },
      {},
    );
    expect(enums).toMatchObject(expectedEnums);

    const indexes = await prisma.$queryRaw<
      { indexname: string; indexdef: string }[]
    >`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    const indexesByName = new Map(
      indexes.map(({ indexname, indexdef }) => [indexname, indexdef]),
    );
    for (const name of [
      'User_email_key',
      'Category_slug_key',
      'Category_name_key',
      'Guide_slug_key',
      'Activity_slug_key',
      'GuideStep_guideId_orderNumber_key',
      'ActivityQuestion_activityId_orderNumber_key',
      'ActivityProgress_userId_activityId_attemptNumber_key',
      'RefreshSession_tokenHash_key',
    ]) {
      expect(indexesByName.get(name)).toMatch(/^CREATE UNIQUE INDEX/);
    }
    for (const name of [
      'User_role_idx',
      'Guide_categoryId_idx',
      'Activity_publicationState_idx',
      'RefreshSession_userId_familyId_idx',
    ]) {
      expect(indexesByName.has(name)).toBe(true);
    }

    const foreignKeys = await prisma.$queryRaw<
      { table_name: string; constraint_name: string; delete_action: string }[]
    >`
      SELECT child.relname AS table_name,
             fk.conname AS constraint_name,
             fk.confdeltype::text AS delete_action
      FROM pg_constraint fk
      JOIN pg_class child ON child.oid = fk.conrelid
      WHERE fk.contype = 'f'
    `;
    const foreignKeysByName = new Map(
      foreignKeys.map(({ constraint_name, delete_action }) => [
        constraint_name,
        delete_action,
      ]),
    );
    for (const name of [
      'Guide_categoryId_fkey',
      'GuideStep_guideId_fkey',
      'Activity_categoryId_fkey',
      'ActivityQuestion_activityId_fkey',
      'ActivityProgress_userId_fkey',
      'ActivityProgress_activityId_fkey',
    ]) {
      expect(foreignKeysByName.get(name)).toBe('r');
    }
    expect(foreignKeysByName.get('RefreshSession_userId_fkey')).toBe('c');
  });

  it('contains the five demo categories, guide steps, and activity questions', async () => {
    expect(await prisma.category.count()).toBe(5);
    expect(
      await prisma.guide.count({ where: { slug: 'ciclo-del-agua' } }),
    ).toBe(1);
    expect(
      await prisma.guideStep.count({
        where: { guide: { slug: 'ciclo-del-agua' } },
      }),
    ).toBe(3);
    expect(
      await prisma.activity.count({
        where: { slug: 'repaso-del-ciclo-del-agua' },
      }),
    ).toBe(1);
    expect(
      await prisma.activityQuestion.count({
        where: { activity: { slug: 'repaso-del-ciclo-del-agua' } },
      }),
    ).toBe(2);
  });

  it('creates an admin only when optional seed credentials are supplied', async () => {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(0);
      return;
    }

    const admin = await prisma.user.findUnique({ where: { email } });
    expect(admin).not.toBeNull();
    if (!admin) {
      throw new Error('Configured seed admin was not created.');
    }
    expect(admin.role).toBe('ADMIN');
    expect(await compare(password, admin.passwordHash)).toBe(true);
  });
});
