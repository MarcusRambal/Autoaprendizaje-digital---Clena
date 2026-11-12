import { ListLessonsUseCase } from '../application/list-lessons.use-case';
import { PublicLessonsController } from './public-lessons.controller';

describe('PublicLessonsController', () => {
  it('only requests published lessons, regardless of client query', async () => {
    const execute = jest.fn().mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });
    const controller = new PublicLessonsController({
      execute,
    } as unknown as ListLessonsUseCase);

    await controller.list({ page: 2, pageSize: 10, order: 'asc' });

    expect(execute).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      order: 'asc',
      publicationState: 'PUBLISHED',
    });
  });
});
