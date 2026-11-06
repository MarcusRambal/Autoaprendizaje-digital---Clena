import { AuthUser } from './auth-user';

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

export interface TokenIssuer {
  issueAccessToken(
    user: Pick<AuthUser, 'id' | 'email' | 'role'>,
  ): Promise<string>;
  issueRefreshToken(
    userId: string,
    familyId?: string,
  ): Promise<IssuedRefreshToken>;
  verifyRefreshToken(token: string): Promise<VerifiedRefreshToken | null>;
  hashRefreshToken(token: string): Promise<string>;
}
