import { GuideFileContent } from '../domain/guide';
import { GuideReadOptions, GuideRepository } from '../domain/guide.repository';
import { GuideApplicationError } from './guide-application.error';

export class GetGuideFileUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(
    id: string,
    options?: GuideReadOptions,
  ): Promise<GuideFileContent> {
    const file = await this.repository.findFile(id, options);
    if (!file) {
      throw new GuideApplicationError(
        404,
        'GUIDE_FILE_NOT_FOUND',
        'The guide does not exist or has no PDF',
      );
    }
    return file;
  }
}
