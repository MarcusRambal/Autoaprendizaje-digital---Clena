import {
  buildPage,
  normalizePageRequest,
  Page,
  SortOrder,
} from '../../../shared/primitives/pagination';
import { Guide, GuidePublicationState } from '../domain/guide';
import { GuideRepository } from '../domain/guide.repository';

export interface ListManagedGuidesInput {
  categoryId?: string;
  search?: string;
  publicationState?: GuidePublicationState;
  page?: number;
  pageSize?: number;
  order?: SortOrder;
}

/** Staff view of the catalog: includes drafts and unpublished guides. */
export class ListManagedGuidesUseCase {
  constructor(private readonly repository: GuideRepository) {}

  async execute(input: ListManagedGuidesInput): Promise<Page<Guide>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.repository.list({
      ...request,
      categoryId: input.categoryId,
      // A blank search means "no search".
      search: input.search?.trim() || undefined,
      // Every state unless the staff member filters by one.
      publicationState: input.publicationState,
      order: input.order ?? 'desc',
    });
    return buildPage(items, total, request);
  }
}
