import { GuideRepository } from '../domain/guide.repository';
import { GuideApplicationError } from './guide-application.error';

export class DeleteGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(id: string): Promise<void> {
    if ((await this.repository.delete(id)) === 'not-found') {
      throw new GuideApplicationError(
        404,
        'GUIDE_NOT_FOUND',
        'Guide not found',
      );
    }
  }
}
