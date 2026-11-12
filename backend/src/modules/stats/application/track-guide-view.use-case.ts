import { GuideViewRepository } from '../domain/guide-view.repository';
import { StatsApplicationError } from './stats-application.error';

export class TrackGuideViewUseCase {
  constructor(private readonly repository: GuideViewRepository) {}

  async execute(guideId: string): Promise<void> {
    const result = await this.repository.track(guideId);
    if (result === 'guide-not-found') {
      throw new StatsApplicationError(
        404,
        'GUIDE_NOT_FOUND',
        'Guide not found',
      );
    }
  }
}
