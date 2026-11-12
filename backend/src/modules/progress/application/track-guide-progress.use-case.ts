import { ProgressRepository } from '../domain/progress.repository';
import { ProgressApplicationError } from './progress-application.error';

export class TrackGuideProgressUseCase {
  constructor(private readonly repository: ProgressRepository) {}

  async execute(userId: string, guideId: string): Promise<void> {
    const result = await this.repository.markGuideRead(userId, guideId);
    if (result === 'not-found') {
      throw new ProgressApplicationError(
        404,
        'GUIDE_NOT_FOUND',
        'Published guide not found',
      );
    }
  }
}
