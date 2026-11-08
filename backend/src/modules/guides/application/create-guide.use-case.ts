import { Guide } from '../domain/guide';
import { GuideRepository } from '../domain/guide.repository';
import { GuideApplicationError } from './guide-application.error';
import { GuideFileInput, parseGuideFile, parseGuideTitle } from './guide-input';

export interface CreateGuideInput {
  title: string;
  categoryId: string;
  file?: GuideFileInput;
}

export class CreateGuideUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(input: CreateGuideInput): Promise<Guide> {
    const title = parseGuideTitle(input.title);
    if (!input.file) {
      throw new GuideApplicationError(
        400,
        'INVALID_GUIDE_FILE',
        'A PDF file is required',
      );
    }

    const result = await this.repository.create({
      title,
      categoryId: input.categoryId,
      file: parseGuideFile(input.file),
    });
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
