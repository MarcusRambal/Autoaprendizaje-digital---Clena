import { Guide } from '../domain/guide';
import { GuideReadOptions, GuideRepository } from '../domain/guide.repository';
import { GuideApplicationError } from './guide-application.error';

export class GetGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(id: string, options?: GuideReadOptions): Promise<Guide> {
    const guide = await this.repository.findById(id, options);
    if (!guide) {
      throw new GuideApplicationError(
        404,
        'GUIDE_NOT_FOUND',
        'Guide not found',
      );
    }
    return guide;
  }
}
