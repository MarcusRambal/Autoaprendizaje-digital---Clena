import { PageRequest, SortOrder } from '../../../shared/primitives/pagination';
import {
  HelpRequest,
  HelpRequestStatus,
  ManagedHelpRequestStatus,
} from './help-request';

export interface NewHelpRequest {
  /** Account that asked for help; null when the staff registers it for someone. */
  requesterId: string | null;
  requesterName: string;
  topic: string;
  description: string;
}

export interface ListHelpRequestsQuery extends PageRequest {
  status?: HelpRequestStatus;
  /** Only the requests made by this account. */
  requesterId?: string;
  order: SortOrder;
}

export interface HelpRequestPage {
  items: HelpRequest[];
  total: number;
}

export interface ChangeStatusInput {
  id: string;
  status: ManagedHelpRequestStatus;
  changedById: string;
  changedAt: Date;
}

export type ChangeStatusResult =
  { kind: 'updated'; helpRequest: HelpRequest } | { kind: 'not-found' };

export interface HelpRequestRepository {
  create(input: NewHelpRequest): Promise<HelpRequest>;
  list(query: ListHelpRequestsQuery): Promise<HelpRequestPage>;
  findById(id: string): Promise<HelpRequest | null>;
  /**
   * Sets the status. ATTENDED records who and when; any other status clears
   * those fields so the request can be reopened.
   */
  changeStatus(input: ChangeStatusInput): Promise<ChangeStatusResult>;
  delete(id: string): Promise<'deleted' | 'not-found'>;
}
