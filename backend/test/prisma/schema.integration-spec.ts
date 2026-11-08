import { compare } from 'bcrypt';
import { resolveDemoAccounts } from '../../prisma/demo-accounts';
import { PrismaClient } from '@prisma/client';

const expectedEnums: Record<string, string[]> = {
  ActivityProgressStatus: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
  HelpRequestStatus: ['PENDING', 'IN_PROGRESS', 'ATTENDED', 'CANCELLED'],
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
        'GuideFile',
        'GuideStep',
        'HelpRequest',
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
      'Guide_search_fts_idx',
      'HelpRequest_status_createdAt_idx',
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
      'ActivityProgress_activityId_fkey',
    ]) {
      expect(foreignKeysByName.get(name)).toBe('r');
    }
    for (const name of [
      'RefreshSession_userId_fkey',
      'ActivityProgress_userId_fkey',
      'GuideFile_guideId_fkey',
    ]) {
      expect(foreignKeysByName.get(name)).toBe('c');
    }
    for (const name of [
      'HelpRequest_requesterId_fkey',
      'HelpRequest_guideId_fkey',
      'HelpRequest_attendedById_fkey',
    ]) {
      expect(foreignKeysByName.get(name)).toBe('n');
    }
  });

  it('contains the four demo categories, guides with steps, help requests, and activity questions', async () => {
    expect(await prisma.category.count()).toBe(4);
    expect(await prisma.guide.count()).toBe(5);
    expect(
      await prisma.guide.count({ where: { slug: 'crear-cuenta-de-correo' } }),
    ).toBe(1);
    expect(
      await prisma.guideStep.count({
        where: { guide: { slug: 'crear-cuenta-de-correo' } },
      }),
    ).toBe(4);
    expect(await prisma.helpRequest.count()).toBe(3);
    expect(
      (
        await prisma.helpRequest.findMany({
          orderBy: { createdAt: 'asc' },
          select: { status: true, requesterName: true },
        })
      ).map(({ status }) => status),
    ).toEqual(expect.arrayContaining(['PENDING', 'IN_PROGRESS', 'ATTENDED']));
    expect(await prisma.guideFile.count()).toBe(5);
    const sampleFile = await prisma.guideFile.findFirstOrThrow();
    expect(Buffer.from(sampleFile.content).subarray(0, 5).toString()).toBe(
      '%PDF-',
    );
    expect(
      await prisma.activity.count({
        where: { slug: 'repaso-correo-electronico' },
      }),
    ).toBe(1);
    expect(
      await prisma.activityQuestion.count({
        where: { activity: { slug: 'repaso-correo-electronico' } },
      }),
    ).toBe(2);
  });

  it('finds guides by keyword with the full-text search expression', async () => {
    const results = await prisma.$queryRaw<{ slug: string }[]>`
      SELECT slug FROM "Guide"
      WHERE to_tsvector('spanish', title || ' ' || description)
            @@ plainto_tsquery('spanish', 'buscando información')
    `;
    expect(results.map(({ slug }) => slug)).toEqual([
      'buscar-informacion-en-internet',
    ]);
  });

  it('creates the demo accounts only when their seed credentials are supplied', async () => {
    const accounts = resolveDemoAccounts(process.env);
    if (!accounts.some((account) => account.role === 'ADMIN')) {
      expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(0);
    }

    for (const account of accounts) {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
      });
      expect(user).not.toBeNull();
      if (!user) {
        throw new Error(`Configured seed ${account.label} was not created.`);
      }
      expect(user.role).toBe(account.role);
      expect(await compare(account.password, user.passwordHash)).toBe(true);
    }
  });
});
