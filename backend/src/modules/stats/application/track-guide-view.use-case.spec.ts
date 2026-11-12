import { GuideViewRepository } from '../domain/guide-view.repository';
import { StatsApplicationError } from './stats-application.error';
import { TrackGuideViewUseCase } from './track-guide-view.use-case';

describe('TrackGuideViewUseCase', () => {
  it('tracks a view for an existing guide', async () => {
    const track = jest.fn().mockResolvedValue('tracked');
    const repository: GuideViewRepository = { track };
    const useCase = new TrackGuideViewUseCase(repository);

    await expect(useCase.execute('guide-id')).resolves.toBeUndefined();
    expect(track).toHaveBeenCalledWith('guide-id');
  });

  it('returns a 404 application error for an unknown guide', async () => {
    const repository: GuideViewRepository = {
      track: () => Promise.resolve('guide-not-found'),
    };
    const useCase = new TrackGuideViewUseCase(repository);

    await expect(useCase.execute('missing-guide')).rejects.toMatchObject({
      statusCode: 404,
      code: 'GUIDE_NOT_FOUND',
    } satisfies Partial<StatsApplicationError>);
  });
});
