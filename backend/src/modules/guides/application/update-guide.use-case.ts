import { Guide } from '../domain/guide';
import { GuideChanges, GuideRepository } from '../domain/guide.repository';
import { GuideApplicationError } from './guide-application.error';
import { GuideFileInput, parseGuideFile, parseGuideTitle } from './guide-input';

export interface UpdateGuideInput {
  id: string;
  title?: string;
  categoryId?: string;
  file?: GuideFileInput;
}

export class UpdateGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(input: UpdateGuideInput): Promise<Guide> {
    const changes: GuideChanges = {};
    if (input.title !== undefined) {
      changes.title = parseGuideTitle(input.title);
    }
    if (input.categoryId !== undefined) {
      changes.categoryId = input.categoryId;
    }
    if (input.file !== undefined) {
      changes.file = parseGuideFile(input.file);
    }
    if (Object.keys(changes).length === 0) {
      throw new GuideApplicationError(
        400,
        'INVALID_GUIDE',
        'Provide at least one of title, categoryId or file',
      );
    }

    const result = await this.repository.update(input.id, changes);
    if (result.kind === 'not-found') {
      throw new GuideApplicationError(
        404,
        'GUIDE_NOT_FOUND',
        'Guide not found',
      );
    }
    if (result.kind === 'category-not-found') {
      throw new GuideApplicationError(
        404,
        'CATEGORY_NOT_FOUND',
        'Category not found',
      );
    }
    return result.guide;
  }
}
