import {
  buildPage,
  normalizePageRequest,
  Page,
  SortOrder,
} from '../../../shared/primitives/pagination';
import { HelpRequest, HelpRequestStatus } from '../domain/help-request';
import { HelpRequestRepository } from '../domain/help-request.repository';

export interface ListHelpRequestsInput {
  status?: HelpRequestStatus;
  requester?: string;
  date?: string;
  order?: SortOrder;
  page?: number;
  pageSize?: number;
}

export class ListHelpRequestsUseCase {
  constructor(private readonly repository: HelpRequestRepository) {}

  async execute(input: ListHelpRequestsInput): Promise<Page<HelpRequest>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.repository.list({
      ...request,
      status: input.status,
      requester: input.requester?.trim() || undefined,
      date: input.date,
      // Oldest first by default: it is the attention queue for the staff.
      order: input.order ?? 'asc',
    });
    return buildPage(items, total, request);
  }
}
