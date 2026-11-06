import { NewAuthSession } from './auth-session';
import { AuthUser } from './auth-user';

export type CreateAuthUserResult =
  { kind: 'created'; user: AuthUser } | { kind: 'duplicate' };

export interface RotateAuthSessionInput {
  tokenHash: string;
  expectedSessionId: string;
  expectedUserId: string;
  expectedFamilyId: string;
  consumedAt: Date;
  nextSession: NewAuthSession;
}

export type RotateAuthSessionResult =
  | { kind: 'rotated' }
  | { kind: 'replayed' }
  | { kind: 'revoked' }
  | { kind: 'expired' }
  | { kind: 'not-found' };

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: {
    email: string;
    passwordHash: string;
    role: 'PUBLIC_USER';
  }): Promise<CreateAuthUserResult>;
  createRefreshSession(session: NewAuthSession): Promise<boolean>;
  /**
   * Looks up, validates, consumes, and replaces a refresh session atomically
   * using its token hash. Replays revoke the full session family.
   */
  rotateRefreshSession(
    input: RotateAuthSessionInput,
  ): Promise<RotateAuthSessionResult>;
  revokeRefreshSessionFamily(familyId: string, revokedAt: Date): Promise<void>;
}
