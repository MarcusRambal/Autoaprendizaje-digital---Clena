import { CategoryRepository } from '../domain/category.repository';
import { CategoryApplicationError } from './category-application.error';

export class DeleteCategoryUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.kind === 'not-found') {
      throw new CategoryApplicationError(
        404,
        'CATEGORY_NOT_FOUND',
        'Category not found',
      );
    }
    if (result.kind === 'in-use') {
      throw new CategoryApplicationError(
        409,
        'CATEGORY_IN_USE',
        'The category has guides or activities. Reassign them to another category before deleting it',
      );
    }
  }
}
