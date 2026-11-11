import {
  buildPage,
  normalizePageRequest,
  Page,
  SortOrder,
} from '../../../shared/primitives/pagination';
import { HelpRequest, HelpRequestStatus } from '../domain/help-request';
import { HelpRequestRepository } from '../domain/help-request.repository';

export interface ListMyHelpRequestsInput {
  /** The signed-in account: a person only ever sees their own requests. */
  requesterId: string;
  status?: HelpRequestStatus;
  order?: SortOrder;
  page?: number;
  pageSize?: number;
}

export class ListMyHelpRequestsUseCase {
  constructor(private readonly repository: HelpRequestRepository) {}

  async execute(input: ListMyHelpRequestsInput): Promise<Page<HelpRequest>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.repository.list({
      ...request,
      requesterId: input.requesterId,
      status: input.status,
      // Newest first: the person wants to see what they just sent.
      order: input.order ?? 'desc',
    });
    return buildPage(items, total, request);
  }
}
