import {
  buildPage,
  normalizePageRequest,
  Page,
  SortOrder,
} from '../../../shared/primitives/pagination';
import { Category } from '../domain/category';
import { CategoryRepository } from '../domain/category.repository';

export interface ListCategoriesInput {
  page?: number;
  pageSize?: number;
  order?: SortOrder;
}

export class ListCategoriesUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(input: ListCategoriesInput): Promise<Page<Category>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.repository.list(
      request,
      input.order ?? 'asc',
    );
    return buildPage(items, total, request);
  }
}
