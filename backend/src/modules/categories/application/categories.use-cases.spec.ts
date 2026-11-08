import { Category } from '../domain/category';
import {
  CategoryData,
  CategoryRepository,
  CreateCategoryResult,
  DeleteCategoryResult,
  RenameCategoryResult,
} from '../domain/category.repository';
import { CreateCategoryUseCase } from './create-category.use-case';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { ListCategoriesUseCase } from './list-categories.use-case';
import { RenameCategoryUseCase } from './rename-category.use-case';

const category: Category = {
  id: 'cat-1',
  title: 'Correo electrónico',
  slug: 'correo-electronico',
};

function repositoryWith(overrides: Partial<CategoryRepository>) {
  return overrides as CategoryRepository;
}

describe('CreateCategoryUseCase', () => {
  const setup = (result: CreateCategoryResult) => {
    const received: CategoryData[] = [];
    const repository = repositoryWith({
      create: (data) => {
        received.push(data);
        return Promise.resolve(result);
      },
    });
    return { useCase: new CreateCategoryUseCase(repository), received };
  };

  it('trims the title and derives the slug', async () => {
    const { useCase, received } = setup({ kind: 'created', category });

    await expect(
      useCase.execute({ title: '  Correo electrónico  ' }),
    ).resolves.toEqual(category);
    expect(received).toEqual([
      { title: 'Correo electrónico', slug: 'correo-electronico' },
    ]);
  });

  it.each(['', '   ', '???', 'x'.repeat(81)])(
    'rejects the invalid title %#',
    async (title) => {
      const { useCase, received } = setup({ kind: 'created', category });

      await expect(useCase.execute({ title })).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_CATEGORY',
      });
      expect(received).toHaveLength(0);
    },
  );

  it('accepts a title of exactly 80 characters', async () => {
    const { useCase } = setup({ kind: 'created', category });

    await expect(
      useCase.execute({ title: 'x'.repeat(80) }),
    ).resolves.toBeDefined();
  });

  it('fails with 409 when the name already exists', async () => {
    const { useCase } = setup({ kind: 'duplicate' });

    await expect(
      useCase.execute({ title: 'Correo electrónico' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'CATEGORY_ALREADY_EXISTS',
    });
  });
});

describe('ListCategoriesUseCase', () => {
  it('returns a normalized page sorted ascending by default', async () => {
    const calls: unknown[][] = [];
    const repository = repositoryWith({
      list: (page, order) => {
        calls.push([page, order]);
        return Promise.resolve({ items: [category], total: 21 });
      },
    });

    const result = await new ListCategoriesUseCase(repository).execute({
      pageSize: 500,
    });

    expect(calls).toEqual([[{ page: 1, pageSize: 100 }, 'asc']]);
    expect(result).toEqual({
      items: [category],
      page: 1,
      pageSize: 100,
      total: 21,
      totalPages: 1,
    });
  });

  it('passes a descending order through', async () => {
    const calls: unknown[][] = [];
    const repository = repositoryWith({
      list: (page, order) => {
        calls.push([page, order]);
        return Promise.resolve({ items: [], total: 0 });
      },
    });

    await new ListCategoriesUseCase(repository).execute({ order: 'desc' });

    expect(calls[0][1]).toBe('desc');
  });
});

describe('RenameCategoryUseCase', () => {
  const setup = (result: RenameCategoryResult) => {
    const received: Array<[string, CategoryData]> = [];
    const repository = repositoryWith({
      rename: (id, data) => {
        received.push([id, data]);
        return Promise.resolve(result);
      },
    });
    return { useCase: new RenameCategoryUseCase(repository), received };
  };

  it('renames the category with a trimmed title and new slug', async () => {
    const { useCase, received } = setup({ kind: 'renamed', category });

    await expect(
      useCase.execute({ id: 'cat-1', title: ' Redes sociales ' }),
    ).resolves.toEqual(category);
    expect(received).toEqual([
      ['cat-1', { title: 'Redes sociales', slug: 'redes-sociales' }],
    ]);
  });

  it('rejects an invalid title before touching the repository', async () => {
    const { useCase, received } = setup({ kind: 'renamed', category });

    await expect(
      useCase.execute({ id: 'cat-1', title: '  ' }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_CATEGORY' });
    expect(received).toHaveLength(0);
  });

  it('maps a missing category to 404 and a repeated name to 409', async () => {
    await expect(
      setup({ kind: 'not-found' }).useCase.execute({ id: 'x', title: 'Nueva' }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
    await expect(
      setup({ kind: 'duplicate' }).useCase.execute({ id: 'x', title: 'Nueva' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'CATEGORY_ALREADY_EXISTS',
    });
  });
});

describe('DeleteCategoryUseCase', () => {
  const run = (result: DeleteCategoryResult) =>
    new DeleteCategoryUseCase(
      repositoryWith({ delete: () => Promise.resolve(result) }),
    ).execute('cat-1');

  it('deletes an unused category', async () => {
    await expect(run({ kind: 'deleted' })).resolves.toBeUndefined();
  });

  it('fails with 404 when the category does not exist', async () => {
    await expect(run({ kind: 'not-found' })).rejects.toMatchObject({
      statusCode: 404,
      code: 'CATEGORY_NOT_FOUND',
    });
  });

  it('refuses to delete a category that is in use', async () => {
    await expect(run({ kind: 'in-use' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CATEGORY_IN_USE',
    });
  });
});
