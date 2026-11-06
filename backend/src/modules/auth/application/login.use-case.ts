import { AuthApplicationError } from './auth-application.error';
import { AuthRepository } from '../domain/auth.repository';
import { CredentialHasher } from '../domain/credential-hasher.port';
import { NewAuthSession } from '../domain/auth-session';
import { PublicAuthUser, toPublicAuthUser } from '../domain/auth-user';
import { TokenIssuer } from '../domain/token-issuer.port';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokensOutput {
  accessToken: string;
  refreshToken: string;
  user: PublicAuthUser;
}

export class LoginUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly credentialHasher: CredentialHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokensOutput> {
    const email = input.email.trim().toLowerCase();
    const user = email ? await this.repository.findUserByEmail(email) : null;
    const validPassword = user
      ? await this.credentialHasher.verify(input.password, user.passwordHash)
      : false;

    if (!user || user.status !== 'ACTIVE' || !validPassword) {
      throw new AuthApplicationError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    const refresh = await this.tokenIssuer.issueRefreshToken(user.id);
    const tokenHash = await this.tokenIssuer.hashRefreshToken(refresh.token);
    const session: NewAuthSession = {
      id: refresh.id,
      userId: user.id,
      familyId: refresh.familyId,
      tokenHash,
      expiresAt: refresh.expiresAt,
    };
    const accessToken = await this.tokenIssuer.issueAccessToken(user);
    const sessionCreated = await this.repository.createRefreshSession(session);
    if (!sessionCreated) {
      throw new AuthApplicationError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    return {
      accessToken,
      refreshToken: refresh.token,
      user: toPublicAuthUser(user),
    };
  }
}
