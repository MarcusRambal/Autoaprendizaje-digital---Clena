import { slugify } from '../../../shared/primitives/slug';
import { CATEGORY_TITLE_MAX_LENGTH } from '../domain/category';
import { CategoryData } from '../domain/category.repository';
import { CategoryApplicationError } from './category-application.error';

/** Validates a category title and derives the slug stored with it. */
export function parseCategoryTitle(rawTitle: string): CategoryData {
  const title = rawTitle.trim();
  const slug = slugify(title);
  if (!title || !slug || title.length > CATEGORY_TITLE_MAX_LENGTH) {
    throw new CategoryApplicationError(
      400,
      'INVALID_CATEGORY',
      `Title must have between 1 and ${CATEGORY_TITLE_MAX_LENGTH} characters and at least one letter or digit`,
    );
  }
  return { title, slug };
}
