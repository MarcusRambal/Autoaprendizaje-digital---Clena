import { CreatableUserRole, User, UserRepository } from './user.repository';

export type DeleteAccountResult = { kind: 'deleted' } | { kind: 'not-found' };
export type CreatedUser = Omit<User, 'role'> & { role: CreatableUserRole };
export type CreateAccountResult =
  { kind: 'created'; user: CreatedUser } | { kind: 'duplicate' };

export interface UserAccountRepository extends UserRepository {
  createWithRole(input: {
    email: string;
    passwordHash: string;
    role: CreatableUserRole;
  }): Promise<CreateAccountResult>;

  /**
   * Erases the account and all personal data tied to it: sessions, learning
   * progress and the help requests made by the user.
   */
  deleteAccount(userId: string): Promise<DeleteAccountResult>;
}
