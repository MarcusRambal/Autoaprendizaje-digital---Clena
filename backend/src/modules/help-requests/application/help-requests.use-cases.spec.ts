import { HelpRequest } from '../domain/help-request';
import {
  ChangeStatusInput,
  ChangeStatusResult,
  HelpRequestRepository,
  ListHelpRequestsQuery,
  NewHelpRequest,
} from '../domain/help-request.repository';
import { ChangeHelpRequestStatusUseCase } from './change-help-request-status.use-case';
import { CreateHelpRequestUseCase } from './create-help-request.use-case';
import { DeleteHelpRequestUseCase } from './delete-help-request.use-case';
import { ListHelpRequestsUseCase } from './list-help-requests.use-case';

const helpRequest: HelpRequest = {
  id: 'request-1',
  requesterName: 'María López',
  topic: 'Correo electrónico',
  status: 'PENDING',
  attendedById: null,
  attendedAt: null,
  createdAt: new Date('2026-11-09T10:00:00.000Z'),
};

const repositoryWith = (overrides: Partial<HelpRequestRepository>) =>
  overrides as HelpRequestRepository;

describe('CreateHelpRequestUseCase', () => {
  const setup = () => {
    const received: NewHelpRequest[] = [];
    const repository = repositoryWith({
      create: (input) => {
        received.push(input);
        return Promise.resolve(helpRequest);
      },
    });
    return { useCase: new CreateHelpRequestUseCase(repository), received };
  };

  it('trims name and topic before saving', async () => {
    const { useCase, received } = setup();

    await expect(
      useCase.execute({
        requesterName: '  María López ',
        topic: ' Correo electrónico  ',
      }),
    ).resolves.toEqual(helpRequest);
    expect(received).toEqual([
      { requesterName: 'María López', topic: 'Correo electrónico' },
    ]);
  });

  it.each([
    ['an empty name', '   ', 'Correo'],
    ['a name over 100 characters', 'x'.repeat(101), 'Correo'],
    ['a topic under 3 characters', 'María', 'ab'],
    ['a topic over 200 characters', 'María', 'x'.repeat(201)],
  ])('rejects %s', async (_name, requesterName, topic) => {
    const { useCase, received } = setup();

    await expect(
      useCase.execute({ requesterName, topic }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_HELP_REQUEST',
    });
    expect(received).toHaveLength(0);
  });

  it('accepts the boundary lengths', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ requesterName: 'x'.repeat(100), topic: 'abc' }),
    ).resolves.toBeDefined();
    await expect(
      useCase.execute({ requesterName: 'M', topic: 'x'.repeat(200) }),
    ).resolves.toBeDefined();
  });
});

describe('ListHelpRequestsUseCase', () => {
  const setup = (total = 0) => {
    const queries: ListHelpRequestsQuery[] = [];
    const repository = repositoryWith({
      list: (query) => {
        queries.push(query);
        return Promise.resolve({ items: [helpRequest], total });
      },
    });
    return { useCase: new ListHelpRequestsUseCase(repository), queries };
  };

  it('uses the oldest-first queue with default pagination', async () => {
    const { useCase, queries } = setup(1);

    const result = await useCase.execute({});

    expect(queries[0]).toEqual({
      page: 1,
      pageSize: 20,
      status: undefined,
      order: 'asc',
    });
    expect(result).toMatchObject({ page: 1, pageSize: 20, totalPages: 1 });
  });

  it('passes the status and order through and clamps the page size', async () => {
    const { useCase, queries } = setup(45);

    const result = await useCase.execute({
      status: 'IN_PROGRESS',
      order: 'desc',
      page: 2,
      pageSize: 500,
    });

    expect(queries[0]).toEqual({
      page: 2,
      pageSize: 100,
      status: 'IN_PROGRESS',
      order: 'desc',
    });
    expect(result.totalPages).toBe(1);
  });
});

describe('ChangeHelpRequestStatusUseCase', () => {
  const now = new Date('2026-11-09T12:00:00.000Z');

  const setup = (result: ChangeStatusResult) => {
    const received: ChangeStatusInput[] = [];
    const repository = repositoryWith({
      changeStatus: (input) => {
        received.push(input);
        return Promise.resolve(result);
      },
    });
    return {
      useCase: new ChangeHelpRequestStatusUseCase(repository, () => now),
      received,
    };
  };

  it('records who changed the status and when', async () => {
    const attended = { ...helpRequest, status: 'ATTENDED' as const };
    const { useCase, received } = setup({
      kind: 'updated',
      helpRequest: attended,
    });

    await expect(
      useCase.execute({
        id: 'request-1',
        status: 'ATTENDED',
        changedById: 'staff-1',
      }),
    ).resolves.toEqual(attended);
    expect(received).toEqual([
      {
        id: 'request-1',
        status: 'ATTENDED',
        changedById: 'staff-1',
        changedAt: now,
      },
    ]);
  });

  it('uses the current time when no clock is injected', async () => {
    const received: ChangeStatusInput[] = [];
    const repository = repositoryWith({
      changeStatus: (input) => {
        received.push(input);
        return Promise.resolve({ kind: 'updated', helpRequest });
      },
    });
    const before = Date.now();

    await new ChangeHelpRequestStatusUseCase(repository).execute({
      id: 'request-1',
      status: 'IN_PROGRESS',
      changedById: 'staff-1',
    });

    expect(received[0].changedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(received[0].changedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('fails with 404 when the request does not exist', async () => {
    const { useCase } = setup({ kind: 'not-found' });

    await expect(
      useCase.execute({
        id: 'missing',
        status: 'PENDING',
        changedById: 'staff-1',
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'HELP_REQUEST_NOT_FOUND',
    });
  });
});

describe('DeleteHelpRequestUseCase', () => {
  const run = (result: 'deleted' | 'not-found') =>
    new DeleteHelpRequestUseCase(
      repositoryWith({ delete: () => Promise.resolve(result) }),
    ).execute('request-1');

  it('deletes an existing request', async () => {
    await expect(run('deleted')).resolves.toBeUndefined();
  });

  it('fails with 404 when the request does not exist', async () => {
    await expect(run('not-found')).rejects.toMatchObject({
      statusCode: 404,
      code: 'HELP_REQUEST_NOT_FOUND',
    });
  });
});
