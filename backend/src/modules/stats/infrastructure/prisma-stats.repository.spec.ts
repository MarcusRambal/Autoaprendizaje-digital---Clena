import { PrismaService } from '../../../shared/database/prisma.service';
import { PrismaStatsRepository } from './prisma-stats.repository';

describe('PrismaStatsRepository', () => {
  it('groups views, orders guides, limits both rankings, and counts requests', async () => {
    const from = new Date('2026-11-01T05:00:00.000Z');
    const to = new Date('2026-11-11T04:59:59.999Z');
    const groupBy = jest.fn().mockResolvedValue([
      { guideId: 'guide-1', _count: { _all: 8 } },
      { guideId: 'guide-2', _count: { _all: 3 } },
    ]);
    const queryRaw = jest
      .fn()
      .mockResolvedValue([{ id: 'category-1', title: 'Correo', views: 11 }]);
    const count = jest
      .fn()
      .mockImplementation(({ where }: { where: { status?: string } }) =>
        Promise.resolve(where.status === 'ATTENDED' ? 2 : 5),
      );
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'guide-1',
        title: 'Guía uno',
        category: { name: 'Correo' },
      },
      {
        id: 'guide-2',
        title: 'Guía dos',
        category: { name: 'Correo' },
      },
    ]);
    const prisma = {
      guideView: { groupBy },
      $queryRaw: queryRaw,
      helpRequest: { count },
      guide: { findMany },
    } as unknown as PrismaService;
    const repository = new PrismaStatsRepository(prisma);

    await expect(repository.getStatistics(from, to)).resolves.toEqual({
      range: { from: '2026-11-01', to: '2026-11-10' },
      topGuides: [
        {
          id: 'guide-1',
          title: 'Guía uno',
          categoryTitle: 'Correo',
          views: 8,
        },
        {
          id: 'guide-2',
          title: 'Guía dos',
          categoryTitle: 'Correo',
          views: 3,
        },
      ],
      topCategories: [{ id: 'category-1', title: 'Correo', views: 11 }],
      helpRequests: { total: 5, attended: 2 },
    });

    expect(groupBy).toHaveBeenCalledWith({
      by: ['guideId'],
      where: { viewedAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: [{ _count: { guideId: 'desc' } }, { guideId: 'asc' }],
      take: 10,
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ['guide-1', 'guide-2'] } },
      select: {
        id: true,
        title: true,
        category: { select: { name: true } },
      },
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledTimes(2);
    expect(count).toHaveBeenCalledWith({
      where: { createdAt: { gte: from, lte: to } },
    });
    expect(count).toHaveBeenCalledWith({
      where: {
        status: 'ATTENDED',
        attendedAt: { gte: from, lte: to },
      },
    });
  });
});
