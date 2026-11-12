import { PageRequest, SortOrder } from '../../../shared/primitives/pagination';
import { UserRole, UserStatus } from './user.repository';

/** What the admin sees about an account. Never includes credentials. */
export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export interface ListUsersQuery extends PageRequest {
  /** Case-insensitive fragment that the email must contain. */
  search?: string;
  role?: UserRole;
  order: SortOrder;
}

export interface UserPage {
  items: UserSummary[];
  total: number;
}

export interface UserListRepository {
  list(query: ListUsersQuery): Promise<UserPage>;
}
