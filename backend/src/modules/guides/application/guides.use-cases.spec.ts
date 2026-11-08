import { Guide } from '../domain/guide';
import {
  CreateGuideResult,
  GuideChanges,
  GuideRepository,
  NewGuide,
  UpdateGuideResult,
} from '../domain/guide.repository';
import { CreateGuideUseCase } from './create-guide.use-case';
import { DeleteGuideUseCase } from './delete-guide.use-case';
import { GetGuideFileUseCase } from './get-guide-file.use-case';
import { GetGuideUseCase } from './get-guide.use-case';
import { ListGuidesUseCase } from './list-guides.use-case';
import { UpdateGuideUseCase } from './update-guide.use-case';

const guide: Guide = {
  id: 'guide-1',
  title: 'Cómo crear una cuenta',
  categoryId: 'cat-1',
  categoryTitle: 'Correo electrónico',
  fileName: 'guia.pdf',
  createdAt: new Date('2026-11-09T10:00:00.000Z'),
  updatedAt: new Date('2026-11-09T10:00:00.000Z'),
};

const pdf = (extra = 20): Uint8Array => {
  const bytes = new Uint8Array(5 + extra).fill(0x20);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"
  return bytes;
};

const repositoryWith = (overrides: Partial<GuideRepository>) =>
  overrides as GuideRepository;

describe('CreateGuideUseCase', () => {
  const setup = (result: CreateGuideResult = { kind: 'created', guide }) => {
    const received: NewGuide[] = [];
    const repository = repositoryWith({
      create: (input) => {
        received.push(input);
        return Promise.resolve(result);
      },
    });
    return { useCase: new CreateGuideUseCase(repository), received };
  };

  it('stores the trimmed title with the validated PDF', async () => {
    const { useCase, received } = setup();
    const content = pdf();

    await expect(
      useCase.execute({
        title: '  Cómo crear una cuenta  ',
        categoryId: 'cat-1',
        file: { originalName: 'C:\\fakepath\\mi guía.pdf', content },
      }),
    ).resolves.toEqual(guide);

    expect(received).toEqual([
      {
        title: 'Cómo crear una cuenta',
        categoryId: 'cat-1',
        file: { originalName: 'mi guía.pdf', content },
      },
    ]);
  });

  it('falls back to a default file name when the original is empty', async () => {
    const { useCase, received } = setup();

    await useCase.execute({
      title: 'Guía',
      categoryId: 'cat-1',
      file: { originalName: '  ', content: pdf() },
    });

    expect(received[0].file.originalName).toBe('guia.pdf');
  });

  it.each(['', '   ', 'x'.repeat(121)])(
    'rejects the title %#',
    async (title) => {
      const { useCase, received } = setup();

      await expect(
        useCase.execute({
          title,
          categoryId: 'cat-1',
          file: { originalName: 'a.pdf', content: pdf() },
        }),
      ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_GUIDE' });
      expect(received).toHaveLength(0);
    },
  );

  it('requires a file', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ title: 'Guía', categoryId: 'cat-1' }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_GUIDE_FILE' });
  });

  it.each([
    ['an empty file', new Uint8Array()],
    ['a file that is not a PDF', new TextEncoder().encode('hello world')],
    ['a PDF over 10 MB', pdf(10 * 1024 * 1024)],
  ])('rejects %s', async (_name, content) => {
    const { useCase, received } = setup();

    await expect(
      useCase.execute({
        title: 'Guía',
        categoryId: 'cat-1',
        file: { originalName: 'a.pdf', content },
      }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_GUIDE_FILE' });
    expect(received).toHaveLength(0);
  });

  it('fails with 404 when the category does not exist', async () => {
    const { useCase } = setup({ kind: 'category-not-found' });

    await expect(
      useCase.execute({
        title: 'Guía',
        categoryId: 'missing',
        file: { originalName: 'a.pdf', content: pdf() },
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
  });
});

describe('UpdateGuideUseCase', () => {
  const setup = (result: UpdateGuideResult = { kind: 'updated', guide }) => {
    const received: Array<[string, GuideChanges]> = [];
    const repository = repositoryWith({
      update: (id, changes) => {
        received.push([id, changes]);
        return Promise.resolve(result);
      },
    });
    return { useCase: new UpdateGuideUseCase(repository), received };
  };

  it('sends only the fields that changed', async () => {
    const { useCase, received } = setup();

    await expect(
      useCase.execute({ id: 'guide-1', title: ' Nuevo título ' }),
    ).resolves.toEqual(guide);
    expect(received).toEqual([['guide-1', { title: 'Nuevo título' }]]);
  });

  it('accepts a new category and a replacement PDF', async () => {
    const { useCase, received } = setup();
    const content = pdf();

    await useCase.execute({
      id: 'guide-1',
      categoryId: 'cat-2',
      file: { originalName: 'nueva.pdf', content },
    });

    expect(received[0][1]).toEqual({
      categoryId: 'cat-2',
      file: { originalName: 'nueva.pdf', content },
    });
  });

  it('rejects an update without any field', async () => {
    const { useCase, received } = setup();

    await expect(useCase.execute({ id: 'guide-1' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_GUIDE',
    });
    expect(received).toHaveLength(0);
  });

  it('validates the title and the file', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ id: 'guide-1', title: '  ' }),
    ).rejects.toMatchObject({ code: 'INVALID_GUIDE' });
    await expect(
      useCase.execute({
        id: 'guide-1',
        file: { originalName: 'a.pdf', content: new Uint8Array([1, 2, 3]) },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_GUIDE_FILE' });
  });

  it('maps a missing guide and a missing category to 404', async () => {
    await expect(
      setup({ kind: 'not-found' }).useCase.execute({ id: 'x', title: 'Hola' }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'GUIDE_NOT_FOUND' });
    await expect(
      setup({ kind: 'category-not-found' }).useCase.execute({
        id: 'x',
        categoryId: 'y',
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
  });
});

describe('DeleteGuideUseCase', () => {
  const run = (result: 'deleted' | 'not-found') =>
    new DeleteGuideUseCase(
      repositoryWith({ delete: () => Promise.resolve(result) }),
    ).execute('guide-1');

  it('deletes an existing guide', async () => {
    await expect(run('deleted')).resolves.toBeUndefined();
  });

  it('fails with 404 when the guide does not exist', async () => {
    await expect(run('not-found')).rejects.toMatchObject({
      statusCode: 404,
      code: 'GUIDE_NOT_FOUND',
    });
  });
});

describe('GetGuideUseCase', () => {
  it('returns the guide or fails with 404', async () => {
    const found = new GetGuideUseCase(
      repositoryWith({ findById: () => Promise.resolve(guide) }),
    );
    const missing = new GetGuideUseCase(
      repositoryWith({ findById: () => Promise.resolve(null) }),
    );

    await expect(found.execute('guide-1')).resolves.toEqual(guide);
    await expect(missing.execute('x')).rejects.toMatchObject({
      statusCode: 404,
      code: 'GUIDE_NOT_FOUND',
    });
  });
});

describe('GetGuideFileUseCase', () => {
  it('returns the PDF or fails with 404', async () => {
    const file = {
      fileName: 'guia.pdf',
      contentType: 'application/pdf',
      content: pdf(),
    };
    const found = new GetGuideFileUseCase(
      repositoryWith({ findFile: () => Promise.resolve(file) }),
    );
    const missing = new GetGuideFileUseCase(
      repositoryWith({ findFile: () => Promise.resolve(null) }),
    );

    await expect(found.execute('guide-1')).resolves.toEqual(file);
    await expect(missing.execute('x')).rejects.toMatchObject({
      statusCode: 404,
      code: 'GUIDE_FILE_NOT_FOUND',
    });
  });
});

describe('ListGuidesUseCase', () => {
  it('lists newest first with a normalized page and the category filter', async () => {
    const queries: unknown[] = [];
    const useCase = new ListGuidesUseCase(
      repositoryWith({
        list: (query) => {
          queries.push(query);
          return Promise.resolve({ items: [guide], total: 41 });
        },
      }),
    );

    const result = await useCase.execute({ categoryId: 'cat-1', pageSize: 20 });

    expect(queries).toEqual([
      { page: 1, pageSize: 20, categoryId: 'cat-1', order: 'desc' },
    ]);
    expect(result).toEqual({
      items: [guide],
      page: 1,
      pageSize: 20,
      total: 41,
      totalPages: 3,
    });
  });

  it('honors an ascending order', async () => {
    const queries: Array<{ order: string }> = [];
    const useCase = new ListGuidesUseCase(
      repositoryWith({
        list: (query) => {
          queries.push(query);
          return Promise.resolve({ items: [], total: 0 });
        },
      }),
    );

    await useCase.execute({ order: 'asc' });

    expect(queries[0].order).toBe('asc');
  });
});
