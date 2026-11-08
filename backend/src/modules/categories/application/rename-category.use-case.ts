import { Category } from '../domain/category';
import { CategoryRepository } from '../domain/category.repository';
import { CategoryApplicationError } from './category-application.error';
import { parseCategoryTitle } from './category-title';

export interface RenameCategoryInput {
  id: string;
  title: string;
}

export class RenameCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(input: RenameCategoryInput): Promise<Category> {
    const result = await this.repository.rename(
      input.id,
      parseCategoryTitle(input.title),
    );
    if (result.kind === 'not-found') {
      throw new CategoryApplicationError(
        404,
        'CATEGORY_NOT_FOUND',
        'Category not found',
      );
    }
    if (result.kind === 'duplicate') {
      throw new CategoryApplicationError(
        409,
        'CATEGORY_ALREADY_EXISTS',
        'A category with that name already exists',
      );
    }
    return result.category;
  }
}
