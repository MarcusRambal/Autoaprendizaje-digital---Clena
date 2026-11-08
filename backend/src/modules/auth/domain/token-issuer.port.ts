import { AuthUser, AuthUserRole } from './auth-user';

export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

export interface IssuedRefreshToken {
  id: string;
  familyId: string;
  token: string;
  expiresAt: Date;
}

export interface VerifiedRefreshToken {
  id: string;
  userId: string;
  familyId: string;
}

export interface VerifiedAccessToken {
  userId: string;
  email: string;
  role: AuthUserRole;
}

export interface TokenIssuer {
  issueAccessToken(
    user: Pick<AuthUser, 'id' | 'email' | 'role'>,
  ): Promise<string>;
  issueRefreshToken(
    userId: string,
    familyId?: string,
  ): Promise<IssuedRefreshToken>;
  verifyRefreshToken(token: string): Promise<VerifiedRefreshToken | null>;
  verifyAccessToken(token: string): Promise<VerifiedAccessToken | null>;
  hashRefreshToken(token: string): Promise<string>;
}
