import { PageRequest, SortOrder } from '../../../shared/primitives/pagination';
import { Category } from './category';

export interface CategoryData {
  title: string;
  slug: string;
}

export type CreateCategoryResult =
  { kind: 'created'; category: Category } | { kind: 'duplicate' };

export type RenameCategoryResult =
  | { kind: 'renamed'; category: Category }
  | { kind: 'not-found' }
  | { kind: 'duplicate' };

export type DeleteCategoryResult =
  { kind: 'deleted' } | { kind: 'not-found' } | { kind: 'in-use' };

export interface CategoryPage {
  items: Category[];
  total: number;
}

export interface CategoryRepository {
  create(data: CategoryData): Promise<CreateCategoryResult>;
  list(page: PageRequest, order: SortOrder): Promise<CategoryPage>;
  rename(id: string, data: CategoryData): Promise<RenameCategoryResult>;
  /** Refuses to delete a category that still has guides or activities. */
  delete(id: string): Promise<DeleteCategoryResult>;
}
