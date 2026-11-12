import {
  buildPage,
  normalizePageRequest,
  Page,
  SortOrder,
} from '../../../shared/primitives/pagination';
import { Guide } from '../domain/guide';
import { GuideRepository } from '../domain/guide.repository';

export interface ListGuidesInput {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  order?: SortOrder;
}

export class ListGuidesUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(input: ListGuidesInput): Promise<Page<Guide>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.repository.list({
      ...request,
      categoryId: input.categoryId,
      // A blank search means "no search".
      search: input.search?.trim() || undefined,
      // The public catalog never shows drafts, whatever the caller sends.
      publicationState: 'PUBLISHED',
      // Newest guides first unless the caller asks otherwise.
      order: input.order ?? 'desc',
    });
    return buildPage(items, total, request);
  }
}
