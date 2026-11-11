import {
  buildPage,
  normalizePageRequest,
  Page,
  SortOrder,
} from '../../../shared/primitives/pagination';
import {
  UserListRepository,
  UserSummary,
} from '../domain/user-list.repository';
import { UserRole } from '../domain/user.repository';

export interface ListUsersInput {
  search?: string;
  role?: UserRole;
  page?: number;
  pageSize?: number;
  order?: SortOrder;
}

export class ListUsersUseCase {
  constructor(private readonly repository: UserListRepository) {}

  async execute(input: ListUsersInput): Promise<Page<UserSummary>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.repository.list({
      ...request,
      // A blank search means "no search".
      search: input.search?.trim() || undefined,
      role: input.role,
      // Alphabetical by email by default: the admin looks people up by it.
      order: input.order ?? 'asc',
    });
    return buildPage(items, total, request);
  }
}
