import { PublicAuthUser } from '../domain/auth-user';

export interface AuthTokensOutput {
  accessToken: string;
  refreshToken: string;
  user: PublicAuthUser;
}