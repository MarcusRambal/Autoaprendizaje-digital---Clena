import { Guide } from '../domain/guide';
import { GuideRepository } from '../domain/guide.repository';
import { GuideApplicationError } from './guide-application.error';

export interface SetGuidePublicationInput {
  id: string;
  published: boolean;
}

export class SetGuidePublicationUseCase {
  constructor(private readonly repository: GuideRepository) {}

  /** Publishing or unpublishing twice is harmless: the end state is the same. */
  async execute(input: SetGuidePublicationInput): Promise<Guide> {
    const result = await this.repository.setPublication(
      input.id,
      input.published ? 'PUBLISHED' : 'DRAFT',
    );
    if (result.kind === 'not-found') {
      throw new GuideApplicationError(
        404,
        'GUIDE_NOT_FOUND',
        'Guide not found',
      );
    }
    return result.guide;
  }
}
