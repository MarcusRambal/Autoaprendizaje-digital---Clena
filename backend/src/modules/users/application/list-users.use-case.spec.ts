import {
  ListUsersQuery,
  UserListRepository,
  UserSummary,
} from '../domain/user-list.repository';
import { ListUsersUseCase } from './list-users.use-case';

const user: UserSummary = {
  id: 'user-1',
  email: 'ana@example.com',
  role: 'PUBLIC_USER',
  status: 'ACTIVE',
  createdAt: new Date('2026-11-09T10:00:00.000Z'),
};

describe('ListUsersUseCase', () => {
  const setup = (total = 41) => {
    const queries: ListUsersQuery[] = [];
    const repository: UserListRepository = {
      list: (query) => {
        queries.push(query);
        return Promise.resolve({ items: [user], total });
      },
    };
    return { useCase: new ListUsersUseCase(repository), queries };
  };

  it('lists alphabetically with a normalized page and builds the page', async () => {
    const { useCase, queries } = setup();

    const result = await useCase.execute({ pageSize: 20 });

    expect(queries).toEqual([
      {
        page: 1,
        pageSize: 20,
        search: undefined,
        role: undefined,
        order: 'asc',
      },
    ]);
    expect(result).toEqual({
      items: [user],
      page: 1,
      pageSize: 20,
      total: 41,
      totalPages: 3,
    });
  });

  it('passes the role filter, a trimmed search and a descending order', async () => {
    const { useCase, queries } = setup();

    await useCase.execute({ search: '  ana ', role: 'STAFF', order: 'desc' });

    expect(queries[0]).toMatchObject({
      search: 'ana',
      role: 'STAFF',
      order: 'desc',
    });
  });

  it('treats a blank search as no search', async () => {
    const { useCase, queries } = setup();

    await useCase.execute({ search: '   ' });

    expect(queries[0].search).toBeUndefined();
  });

  it('clamps an out-of-range page size', async () => {
    const { useCase, queries } = setup();

    await useCase.execute({ page: 0, pageSize: 5000 });

    expect(queries[0]).toMatchObject({ page: 1, pageSize: 100 });
  });
});
