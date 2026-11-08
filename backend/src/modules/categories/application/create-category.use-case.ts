import { Category } from '../domain/category';
import { CategoryRepository } from '../domain/category.repository';
import { CategoryApplicationError } from './category-application.error';
import { parseCategoryTitle } from './category-title';

export interface CreateCategoryInput {
  title: string;
}

export class CreateCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const result = await this.repository.create(
      parseCategoryTitle(input.title),
    );
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
