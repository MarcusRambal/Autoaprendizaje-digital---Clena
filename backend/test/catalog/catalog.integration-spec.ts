import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaCategoryRepository } from '../../src/modules/categories/infrastructure/prisma-category.repository';
import { PrismaGuideRepository } from '../../src/modules/guides/infrastructure/prisma-guide.repository';
import { PrismaHelpRequestRepository } from '../../src/modules/help-requests/infrastructure/prisma-help-request.repository';
import { PrismaUserRepository } from '../../src/modules/users/infrastructure/prisma-user.repository';
import { PrismaService } from '../../src/shared/database/prisma.service';

const prisma = new PrismaClient();
const service = prisma as unknown as PrismaService;
const categories = new PrismaCategoryRepository(service);
const guides = new PrismaGuideRepository(service);
const helpRequests = new PrismaHelpRequestRepository(service);
const users = new PrismaUserRepository(service);

const run = randomUUID().slice(0, 8);
const pdf = (text: string) => Buffer.from(`%PDF-1.4 ${text}`);

const createdCategoryIds = new Set<string>();
const createdUserIds = new Set<string>();

async function newCategory(name: string): Promise<string> {
  const result = await categories.create({
    title: `${name} ${run}`,
    slug: `${name.toLowerCase()}-${run}`,
  });
  if (result.kind !== 'created') {
    throw new Error('category not created');
  }
  createdCategoryIds.add(result.category.id);
  return result.category.id;
}

async function newUser(
  label: string,
  role: 'PUBLIC_USER' | 'STAFF' = 'PUBLIC_USER',
) {
  const user = await prisma.user.create({
    data: { email: `${label}-${run}@example.com`, passwordHash: 'x', role },
  });
  createdUserIds.add(user.id);
  return user;
}

afterAll(async () => {
  const userIds = [...createdUserIds];
  const categoryIds = [...createdCategoryIds];
  await prisma.helpRequest.deleteMany({
    where: {
      OR: [
        { requesterId: { in: userIds } },
        { attendedById: { in: userIds } },
        { topic: { contains: run } },
      ],
    },
  });
  await prisma.activityProgress.deleteMany({
    where: { userId: { in: userIds } },
  });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.guideStep.deleteMany({
    where: { guide: { categoryId: { in: categoryIds } } },
  });
  await prisma.guide.deleteMany({ where: { categoryId: { in: categoryIds } } });
  await prisma.activity.deleteMany({
    where: { categoryId: { in: categoryIds } },
  });
  await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
  await prisma.$disconnect();
});

describe('PrismaCategoryRepository (PostgreSQL)', () => {
  it('creates a category and rejects repeated names or slugs', async () => {
    const created = await categories.create({
      title: `Correo ${run}`,
      slug: `correo-${run}`,
    });
    expect(created.kind).toBe('created');
    if (created.kind === 'created') {
      createdCategoryIds.add(created.category.id);
      expect(created.category).toMatchObject({
        title: `Correo ${run}`,
        slug: `correo-${run}`,
      });
    }

    await expect(
      categories.create({ title: `Correo ${run}`, slug: `otro-${run}` }),
    ).resolves.toEqual({ kind: 'duplicate' });
    // Different capitalization still collides through the slug.
    await expect(
      categories.create({ title: `CORREO ${run}`, slug: `correo-${run}` }),
    ).resolves.toEqual({ kind: 'duplicate' });
  });

  it('lists categories sorted by title and paginates consistently', async () => {
    await newCategory('Beta');
    await newCategory('Alfa');
    await newCategory('Gamma');

    const asc = await categories.list({ page: 1, pageSize: 100 }, 'asc');
    const desc = await categories.list({ page: 1, pageSize: 100 }, 'desc');
    const mine = (titles: string[]) => titles.filter((t) => t.endsWith(run));

    expect(mine(asc.items.map((c) => c.title))).toEqual(
      mine(asc.items.map((c) => c.title)).sort(),
    );
    expect(mine(desc.items.map((c) => c.title))).toEqual(
      mine(asc.items.map((c) => c.title)).reverse(),
    );
    expect(asc.total).toBe(await prisma.category.count());

    const first = await categories.list({ page: 1, pageSize: 2 }, 'asc');
    const second = await categories.list({ page: 2, pageSize: 2 }, 'asc');
    const expected = asc.items.slice(0, 4).map((c) => c.id);
    expect([...first.items, ...second.items].map((c) => c.id)).toEqual(
      expected,
    );
  });

  it('renames a category, updating its slug', async () => {
    const id = await newCategory('Vieja');

    const renamed = await categories.rename(id, {
      title: `Nueva ${run}`,
      slug: `nueva-${run}`,
    });

    expect(renamed).toMatchObject({
      kind: 'renamed',
      category: { id, title: `Nueva ${run}`, slug: `nueva-${run}` },
    });
  });

  it('reports a missing category or a name already in use on rename', async () => {
    const id = await newCategory('Uno');
    await newCategory('Dos');

    await expect(
      categories.rename(randomUUID(), { title: 'X', slug: `x-${run}` }),
    ).resolves.toEqual({ kind: 'not-found' });
    await expect(
      categories.rename(id, { title: `Dos ${run}`, slug: `dos-${run}` }),
    ).resolves.toEqual({ kind: 'duplicate' });
  });

  it('deletes only categories that are not in use', async () => {
    const unused = await newCategory('Libre');
    const withGuide = await newCategory('ConGuia');
    const withActivity = await newCategory('ConActividad');
    await prisma.guide.create({
      data: { title: 'g', slug: `g-${run}`, categoryId: withGuide },
    });
    await prisma.activity.create({
      data: {
        title: 'a',
        slug: `a-${run}`,
        description: 'd',
        categoryId: withActivity,
      },
    });

    await expect(categories.delete(unused)).resolves.toEqual({
      kind: 'deleted',
    });
    await expect(categories.delete(unused)).resolves.toEqual({
      kind: 'not-found',
    });
    await expect(categories.delete(withGuide)).resolves.toEqual({
      kind: 'in-use',
    });
    await expect(categories.delete(withActivity)).resolves.toEqual({
      kind: 'in-use',
    });
    expect(await prisma.category.count({ where: { id: withGuide } })).toBe(1);
  });
});

describe('PrismaGuideRepository (PostgreSQL)', () => {
  let categoryId: string;
  let otherCategoryId: string;

  beforeAll(async () => {
    categoryId = await newCategory('GuiasA');
    otherCategoryId = await newCategory('GuiasB');
  });

  it('creates a published guide with its PDF and a generated slug', async () => {
    const content = pdf('contenido');

    const result = await guides.create({
      title: `Cómo crear una cuenta ${run}`,
      categoryId,
      file: { originalName: 'cuenta.pdf', content },
    });

    expect(result.kind).toBe('created');
    if (result.kind !== 'created') {
      throw new Error('unreachable');
    }
    expect(result.guide).toMatchObject({
      title: `Cómo crear una cuenta ${run}`,
      categoryId,
      categoryTitle: `GuiasA ${run}`,
      fileName: 'cuenta.pdf',
    });
    const stored = await prisma.guide.findUniqueOrThrow({
      where: { id: result.guide.id },
      include: { file: true },
    });
    expect(stored.publicationState).toBe('PUBLISHED');
    expect(stored.slug).toBe(`como-crear-una-cuenta-${run}`);
    expect(stored.file?.sizeBytes).toBe(content.length);
    expect(Buffer.from(stored.file?.content ?? []).equals(content)).toBe(true);
  });

  it('keeps slugs unique when two guides share a title', async () => {
    const input = {
      title: `Mismo título ${run}`,
      categoryId,
      file: { originalName: 'a.pdf', content: pdf('a') },
    };

    const first = await guides.create(input);
    const second = await guides.create(input);

    expect(first.kind).toBe('created');
    expect(second.kind).toBe('created');
    const rows = await prisma.guide.findMany({
      where: { title: input.title },
      select: { slug: true },
    });
    expect(new Set(rows.map((row) => row.slug)).size).toBe(2);
  });

  it('reports a missing category without creating anything', async () => {
    const before = await prisma.guide.count();

    await expect(
      guides.create({
        title: 'Sin categoría',
        categoryId: randomUUID(),
        file: { originalName: 'a.pdf', content: pdf('a') },
      }),
    ).resolves.toEqual({ kind: 'category-not-found' });
    expect(await prisma.guide.count()).toBe(before);
  });

  it('lists only published guides, filtered, newest first and paginated', async () => {
    const make = async (title: string, category: string, at: Date) =>
      prisma.guide.create({
        data: {
          title: `${title} ${run}`,
          slug: `${title.toLowerCase()}-${run}`,
          publicationState: 'PUBLISHED',
          categoryId: category,
          createdAt: at,
        },
      });
    const old = await make(
      'Vieja',
      otherCategoryId,
      new Date('2026-01-01T00:00:00Z'),
    );
    const mid = await make(
      'Media',
      otherCategoryId,
      new Date('2026-02-01T00:00:00Z'),
    );
    const recent = await make(
      'Reciente',
      otherCategoryId,
      new Date('2026-03-01T00:00:00Z'),
    );
    await prisma.guide.create({
      data: {
        title: `Borrador ${run}`,
        slug: `borrador-${run}`,
        publicationState: 'DRAFT',
        categoryId: otherCategoryId,
      },
    });

    const desc = await guides.list({
      page: 1,
      pageSize: 10,
      categoryId: otherCategoryId,
      order: 'desc',
    });
    const asc = await guides.list({
      page: 1,
      pageSize: 10,
      categoryId: otherCategoryId,
      order: 'asc',
    });
    const secondPage = await guides.list({
      page: 2,
      pageSize: 2,
      categoryId: otherCategoryId,
      order: 'desc',
    });

    expect(desc.total).toBe(3);
    expect(desc.items.map((g) => g.id)).toEqual([recent.id, mid.id, old.id]);
    expect(asc.items.map((g) => g.id)).toEqual([old.id, mid.id, recent.id]);
    expect(secondPage.items.map((g) => g.id)).toEqual([old.id]);
    expect(desc.items[0]).toMatchObject({
      categoryTitle: `GuiasB ${run}`,
      fileName: null,
    });
  });

  it('finds published guides and their PDF, but not drafts or missing files', async () => {
    const created = await guides.create({
      title: `Con PDF ${run}`,
      categoryId,
      file: { originalName: 'tilde-ñ.pdf', content: pdf('abc') },
    });
    if (created.kind !== 'created') {
      throw new Error('unreachable');
    }
    const draft = await prisma.guide.create({
      data: {
        title: `Borrador 2 ${run}`,
        slug: `borrador-2-${run}`,
        publicationState: 'DRAFT',
        categoryId,
        file: {
          create: {
            originalName: 'd.pdf',
            sizeBytes: 3,
            content: Buffer.from('%PD'),
          },
        },
      },
    });
    const withoutFile = await prisma.guide.create({
      data: {
        title: `Sin PDF ${run}`,
        slug: `sin-pdf-${run}`,
        publicationState: 'PUBLISHED',
        categoryId,
      },
    });

    await expect(guides.findById(created.guide.id)).resolves.toMatchObject({
      id: created.guide.id,
      fileName: 'tilde-ñ.pdf',
    });
    await expect(guides.findById(draft.id)).resolves.toBeNull();
    const file = await guides.findFile(created.guide.id);
    expect(file).toMatchObject({
      fileName: 'tilde-ñ.pdf',
      contentType: 'application/pdf',
    });
    expect(Buffer.from(file?.content ?? []).equals(pdf('abc'))).toBe(true);
    await expect(guides.findFile(draft.id)).resolves.toBeNull();
    await expect(guides.findFile(withoutFile.id)).resolves.toBeNull();
    await expect(guides.findFile(randomUUID())).resolves.toBeNull();
  });

  it('updates title, category and replaces the PDF', async () => {
    const created = await guides.create({
      title: `Original ${run}`,
      categoryId,
      file: { originalName: 'v1.pdf', content: pdf('v1') },
    });
    if (created.kind !== 'created') {
      throw new Error('unreachable');
    }

    const renamed = await guides.update(created.guide.id, {
      title: `Renombrada ${run}`,
      categoryId: otherCategoryId,
    });
    const replaced = await guides.update(created.guide.id, {
      file: { originalName: 'v2.pdf', content: pdf('version dos') },
    });

    expect(renamed).toMatchObject({
      kind: 'updated',
      guide: {
        title: `Renombrada ${run}`,
        categoryId: otherCategoryId,
        fileName: 'v1.pdf',
      },
    });
    expect(replaced).toMatchObject({
      kind: 'updated',
      guide: { fileName: 'v2.pdf' },
    });
    const file = await guides.findFile(created.guide.id);
    expect(Buffer.from(file?.content ?? []).equals(pdf('version dos'))).toBe(
      true,
    );
    expect(
      await prisma.guideFile.count({ where: { guideId: created.guide.id } }),
    ).toBe(1);
  });

  it('attaches a PDF to a guide that had none', async () => {
    const bare = await prisma.guide.create({
      data: {
        title: `Bare ${run}`,
        slug: `bare-${run}`,
        publicationState: 'PUBLISHED',
        categoryId,
      },
    });

    await expect(
      guides.update(bare.id, {
        file: { originalName: 'nuevo.pdf', content: pdf('n') },
      }),
    ).resolves.toMatchObject({
      kind: 'updated',
      guide: { fileName: 'nuevo.pdf' },
    });
  });

  it('reports missing guides and categories on update', async () => {
    const created = await guides.create({
      title: `Para fallar ${run}`,
      categoryId,
      file: { originalName: 'a.pdf', content: pdf('a') },
    });
    if (created.kind !== 'created') {
      throw new Error('unreachable');
    }

    await expect(guides.update(randomUUID(), { title: 'x' })).resolves.toEqual({
      kind: 'not-found',
    });
    await expect(
      guides.update(created.guide.id, { categoryId: randomUUID() }),
    ).resolves.toEqual({ kind: 'category-not-found' });
    expect(
      (
        await prisma.guide.findUniqueOrThrow({
          where: { id: created.guide.id },
        })
      ).categoryId,
    ).toBe(categoryId);
  });

  it('deletes a guide together with its steps and PDF', async () => {
    const created = await guides.create({
      title: `Para borrar ${run}`,
      categoryId,
      file: { originalName: 'a.pdf', content: pdf('a') },
    });
    if (created.kind !== 'created') {
      throw new Error('unreachable');
    }
    await prisma.guideStep.create({
      data: {
        guideId: created.guide.id,
        orderNumber: 1,
        title: 'Paso',
        instructions: 'Haz algo',
      },
    });

    await expect(guides.delete(created.guide.id)).resolves.toBe('deleted');

    expect(await prisma.guide.count({ where: { id: created.guide.id } })).toBe(
      0,
    );
    expect(
      await prisma.guideStep.count({ where: { guideId: created.guide.id } }),
    ).toBe(0);
    expect(
      await prisma.guideFile.count({ where: { guideId: created.guide.id } }),
    ).toBe(0);
    await expect(guides.delete(created.guide.id)).resolves.toBe('not-found');
  });
});

describe('PrismaHelpRequestRepository (PostgreSQL)', () => {
  it('creates a PENDING request with the name and topic', async () => {
    const created = await helpRequests.create({
      requesterName: `María ${run}`,
      topic: `Correo ${run}`,
    });

    expect(created).toMatchObject({
      requesterName: `María ${run}`,
      topic: `Correo ${run}`,
      status: 'PENDING',
      attendedById: null,
      attendedAt: null,
    });
  });

  it('filters by status and orders and paginates without gaps', async () => {
    const ids: string[] = [];
    for (let index = 0; index < 4; index += 1) {
      const row = await prisma.helpRequest.create({
        data: {
          requesterName: `Persona ${index}`,
          topic: `Lista ${index} ${run}`,
          status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
          createdAt: new Date(Date.UTC(2026, 5, 1, 10, index)),
        },
      });
      ids.push(row.id);
    }
    const mine = (items: Array<{ id: string }>) =>
      items.map((item) => item.id).filter((id) => ids.includes(id));

    const all = await helpRequests.list({
      page: 1,
      pageSize: 100,
      order: 'asc',
    });
    const desc = await helpRequests.list({
      page: 1,
      pageSize: 100,
      order: 'desc',
    });
    const pending = await helpRequests.list({
      page: 1,
      pageSize: 100,
      order: 'asc',
      status: 'PENDING',
    });

    expect(mine(all.items)).toEqual(ids);
    expect(mine(desc.items)).toEqual([...ids].reverse());
    expect(mine(pending.items)).toEqual(ids.slice(1));
    expect(all.total).toBe(await prisma.helpRequest.count());

    const first = await helpRequests.list({
      page: 1,
      pageSize: 3,
      order: 'asc',
    });
    const second = await helpRequests.list({
      page: 2,
      pageSize: 3,
      order: 'asc',
    });
    expect([...first.items, ...second.items].map((i) => i.id)).toEqual(
      all.items.slice(0, 6).map((i) => i.id),
    );
  });

  it('records who attended and when, and clears it when reopened', async () => {
    const staff = await newUser('staff-hr', 'STAFF');
    const created = await helpRequests.create({
      requesterName: 'Elena',
      topic: `Redes ${run}`,
    });
    const attendedAt = new Date('2026-11-09T12:00:00.000Z');

    const inProgress = await helpRequests.changeStatus({
      id: created.id,
      status: 'IN_PROGRESS',
      changedById: staff.id,
      changedAt: attendedAt,
    });
    const attended = await helpRequests.changeStatus({
      id: created.id,
      status: 'ATTENDED',
      changedById: staff.id,
      changedAt: attendedAt,
    });
    const reopened = await helpRequests.changeStatus({
      id: created.id,
      status: 'PENDING',
      changedById: staff.id,
      changedAt: attendedAt,
    });

    expect(inProgress).toMatchObject({
      kind: 'updated',
      helpRequest: {
        status: 'IN_PROGRESS',
        attendedById: null,
        attendedAt: null,
      },
    });
    expect(attended).toMatchObject({
      kind: 'updated',
      helpRequest: { status: 'ATTENDED', attendedById: staff.id, attendedAt },
    });
    expect(reopened).toMatchObject({
      kind: 'updated',
      helpRequest: { status: 'PENDING', attendedById: null, attendedAt: null },
    });
  });

  it('reports a missing request on status change and delete', async () => {
    const staff = await newUser('staff-hr2', 'STAFF');

    await expect(
      helpRequests.changeStatus({
        id: randomUUID(),
        status: 'ATTENDED',
        changedById: staff.id,
        changedAt: new Date(),
      }),
    ).resolves.toEqual({ kind: 'not-found' });
    await expect(helpRequests.delete(randomUUID())).resolves.toBe('not-found');
  });

  it('deletes a request', async () => {
    const created = await helpRequests.create({
      requesterName: 'Borrar',
      topic: `Borrar ${run}`,
    });

    await expect(helpRequests.delete(created.id)).resolves.toBe('deleted');
    expect(await prisma.helpRequest.count({ where: { id: created.id } })).toBe(
      0,
    );
  });
});

describe('PrismaUserRepository.deleteAccount (PostgreSQL)', () => {
  it('erases the account, its sessions, progress and own help requests', async () => {
    const category = await newCategory('Cuenta');
    const staff = await newUser('staff-del', 'STAFF');
    const user = await newUser('victim');
    const activity = await prisma.activity.create({
      data: {
        title: 'act',
        slug: `act-del-${run}`,
        description: 'd',
        categoryId: category,
      },
    });
    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        familyId: randomUUID(),
        tokenHash: `hash-${run}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await prisma.activityProgress.create({
      data: { userId: user.id, activityId: activity.id, attemptNumber: 1 },
    });
    const own = await prisma.helpRequest.create({
      data: { requesterId: user.id, requesterName: 'Yo', topic: `Mío ${run}` },
    });
    const handled = await prisma.helpRequest.create({
      data: {
        requesterName: 'Otra persona',
        topic: `Atendida por staff ${run}`,
        status: 'ATTENDED',
        attendedById: staff.id,
        attendedAt: new Date(),
      },
    });

    await expect(users.deleteAccount(user.id)).resolves.toEqual({
      kind: 'deleted',
    });

    expect(await prisma.user.count({ where: { id: user.id } })).toBe(0);
    expect(
      await prisma.refreshSession.count({ where: { userId: user.id } }),
    ).toBe(0);
    expect(
      await prisma.activityProgress.count({ where: { userId: user.id } }),
    ).toBe(0);
    expect(await prisma.helpRequest.count({ where: { id: own.id } })).toBe(0);
    expect(await prisma.helpRequest.count({ where: { id: handled.id } })).toBe(
      1,
    );
  });

  it('keeps the help requests a staff member attended when that account is deleted', async () => {
    const staff = await newUser('staff-gone', 'STAFF');
    const handled = await prisma.helpRequest.create({
      data: {
        requesterName: 'Persona',
        topic: `Sigue existiendo ${run}`,
        status: 'ATTENDED',
        attendedById: staff.id,
        attendedAt: new Date(),
      },
    });

    await expect(users.deleteAccount(staff.id)).resolves.toEqual({
      kind: 'deleted',
    });

    const kept = await prisma.helpRequest.findUniqueOrThrow({
      where: { id: handled.id },
    });
    expect(kept.attendedById).toBeNull();
  });

  it('reports an unknown user', async () => {
    await expect(users.deleteAccount(randomUUID())).resolves.toEqual({
      kind: 'not-found',
    });
  });
});
