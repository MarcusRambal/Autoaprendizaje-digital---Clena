import { UserRepository } from './user.repository';

export type DeleteAccountResult = { kind: 'deleted' } | { kind: 'not-found' };

export interface UserAccountRepository extends UserRepository {
  /**
   * Erases the account and all personal data tied to it: sessions, learning
   * progress and the help requests made by the user.
   */
  deleteAccount(userId: string): Promise<DeleteAccountResult>;
}
