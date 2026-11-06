import {
  UserStatusChangeResult,
  UserStatusRepository,
} from '../domain/user-status.repository';
import { UserStatus } from '../domain/user.repository';

export interface ChangeUserStatusInput {
  userId: string;
  status: UserStatus;
}

export class ChangeUserStatusUseCase {
  constructor(
    private readonly repository: UserStatusRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(input: ChangeUserStatusInput): Promise<UserStatusChangeResult> {
    return this.repository.updateStatus(input.userId, input.status, this.now());
  }
}
