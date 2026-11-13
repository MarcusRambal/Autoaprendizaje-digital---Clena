//Interfaz de conexion con el repositorio de autenticacion
import { NewAuthSession } from './auth-session';
import { AuthUser } from './auth-user';

//Errores esperados al crear un usuario de autenticacion
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
    privacyAcceptedAt: Date;
    privacyNoticeVersion: string;
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
