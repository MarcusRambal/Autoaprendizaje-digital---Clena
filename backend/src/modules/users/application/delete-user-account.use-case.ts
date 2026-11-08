import { UserAccountRepository } from '../domain/user-account.repository';
import { UserApplicationError } from './user-application.error';

export class DeleteUserAccountUseCase {
  constructor(private readonly repository: UserAccountRepository) {}

  async execute(userId: string): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UserApplicationError(404, 'USER_NOT_FOUND', 'User not found');
    }
    // Deleting the last administrator would leave the platform unmanageable.
    if (user.role === 'ADMIN') {
      throw new UserApplicationError(
        409,
        'ADMIN_ACCOUNT_PROTECTED',
        'Administrator accounts cannot be deleted',
      );
    }

    const result = await this.repository.deleteAccount(userId);
    if (result.kind === 'not-found') {
      throw new UserApplicationError(404, 'USER_NOT_FOUND', 'User not found');
    }
  }
}
