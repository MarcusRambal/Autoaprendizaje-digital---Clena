import { User, UserRepository, UserStatus } from './user.repository';

export type UserStatusChangeResult =
  { kind: 'updated'; user: User } | { kind: 'not-found' };

export interface UserStatusRepository extends UserRepository {
  updateStatus(
    userId: string,
    status: UserStatus,
    changedAt: Date,
  ): Promise<UserStatusChangeResult>;
}
