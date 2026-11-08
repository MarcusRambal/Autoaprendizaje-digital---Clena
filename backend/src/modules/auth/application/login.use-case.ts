import { AuthApplicationError } from './auth-application.error';
import { AuthRepository } from '../domain/auth.repository';
import { CredentialHasher } from '../domain/credential-hasher.port';
import { NewAuthSession } from '../domain/auth-session';
import { toPublicAuthUser } from '../domain/auth-user';
import { TokenIssuer } from '../domain/token-issuer.port';
import { Email, InvalidEmailError } from '../domain/email.vo';
import { AuthTokensOutput } from './auth-tokens.output';

export interface LoginInput {
  email: string;
  password: string;
}

const INVALID = () =>
  new AuthApplicationError(
    401,
    'INVALID_CREDENTIALS',
    'Invalid email or password',
  );

export class LoginUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly credentialHasher: CredentialHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokensOutput> {
    if (
      !input ||
      typeof input.email !== 'string' ||
      typeof input.password !== 'string'
    ) {
      throw INVALID();
    }

    let email: string;
    try {
      email = Email.create(input.email).toString();
    } catch (error) {
      if (error instanceof InvalidEmailError) {
        throw INVALID();
      }
      throw error;
    }

    const user = await this.repository.findUserByEmail(email);

    const validPassword = user
      ? await this.credentialHasher.verify(input.password, user.passwordHash)
      : false;

    if (!user || user.status !== 'ACTIVE' || !validPassword) {
      throw INVALID();
    }

    const refresh = await this.tokenIssuer.issueRefreshToken(user.id);
    const tokenHash = await this.tokenIssuer.hashRefreshToken(refresh.token);

    const accessToken = await this.tokenIssuer.issueAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const session: NewAuthSession = {
      id: refresh.id,
      userId: user.id,
      familyId: refresh.familyId,
      tokenHash,
      expiresAt: refresh.expiresAt,
    };
    const sessionCreated = await this.repository.createRefreshSession(session);
    if (!sessionCreated) {
      throw INVALID();
    }

    return {
      accessToken,
      refreshToken: refresh.token,
      user: toPublicAuthUser(user),
    };
  }
}
