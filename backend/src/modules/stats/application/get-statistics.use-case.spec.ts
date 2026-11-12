import { Statistics } from '../domain/statistics';
import { StatsRepository } from '../domain/stats.repository';
import { GetStatisticsUseCase } from './get-statistics.use-case';
import { StatsApplicationError } from './stats-application.error';

const now = () => new Date('2026-11-12T12:00:00-05:00');

const emptyStatistics: Statistics = {
  range: { from: '', to: '' },
  topGuides: [],
  topCategories: [],
  helpRequests: { total: 0, attended: 0 },
};

function setup(statistics = emptyStatistics) {
  const getStatistics = jest.fn().mockResolvedValue(statistics);
  const repository: StatsRepository = { getStatistics };
  return {
    useCase: new GetStatisticsUseCase(repository, now),
    getStatistics,
  };
}

describe('GetStatisticsUseCase', () => {
  it('uses the last 30 Colombia calendar days by default', async () => {
    const { useCase, getStatistics } = setup();

    await expect(useCase.execute()).resolves.toMatchObject({
      range: { from: '2026-10-14', to: '2026-11-12' },
      topGuides: [],
      topCategories: [],
      helpRequests: { total: 0, attended: 0 },
    });
    expect(getStatistics).toHaveBeenCalledWith(
      new Date('2026-10-14T00:00:00-05:00'),
      new Date('2026-11-12T23:59:59.999-05:00'),
    );
  });

  it('uses a supplied date range and returns its range in the response', async () => {
    const { useCase, getStatistics } = setup();

    await expect(
      useCase.execute({ from: '2026-11-01', to: '2026-11-10' }),
    ).resolves.toMatchObject({
      range: { from: '2026-11-01', to: '2026-11-10' },
    });
    expect(getStatistics).toHaveBeenCalledWith(
      new Date('2026-11-01T00:00:00-05:00'),
      new Date('2026-11-10T23:59:59.999-05:00'),
    );
  });

  it('rejects from dates later than to', async () => {
    const { useCase, getStatistics } = setup();

    await expect(
      useCase.execute({ from: '2026-11-10', to: '2026-11-09' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_STATS_RANGE',
    } satisfies Partial<StatsApplicationError>);
    expect(getStatistics).not.toHaveBeenCalled();
  });

  it('rejects ranges longer than 366 calendar days', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ from: '2025-11-11', to: '2026-11-12' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_STATS_RANGE',
    });
  });

  it('returns empty aggregates as arrays and zero counts', async () => {
    const { useCase } = setup();

    await expect(useCase.execute()).resolves.toMatchObject({
      topGuides: [],
      topCategories: [],
      helpRequests: { total: 0, attended: 0 },
    });
  });

  it('returns top guides in descending view-count order', async () => {
    const { useCase } = setup({
      ...emptyStatistics,
      topGuides: [
        { id: 'guide-low', title: 'Low', categoryTitle: 'Category', views: 2 },
        {
          id: 'guide-high',
          title: 'High',
          categoryTitle: 'Category',
          views: 9,
        },
      ],
    });

    await expect(useCase.execute()).resolves.toMatchObject({
      topGuides: [{ id: 'guide-high' }, { id: 'guide-low' }],
    });
  });
});
