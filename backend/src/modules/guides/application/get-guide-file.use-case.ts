import { GuideFileContent } from '../domain/guide';
import { GuideRepository } from '../domain/guide.repository';
import { GuideApplicationError } from './guide-application.error';

export class GetGuideFileUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(id: string): Promise<GuideFileContent> {
    const file = await this.repository.findFile(id);
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
