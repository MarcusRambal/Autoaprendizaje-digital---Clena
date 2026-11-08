import { AuthApplicationError } from './auth-application.error';
import { AuthRepository } from '../domain/auth.repository';
import { NewAuthSession } from '../domain/auth-session';
import { toPublicAuthUser } from '../domain/auth-user';
import { TokenIssuer } from '../domain/token-issuer.port';
import { AuthTokensOutput } from './auth-tokens.output';

export interface RefreshInput {
  refreshToken: string;
}

export class RefreshUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenIssuer: TokenIssuer,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: RefreshInput): Promise<AuthTokensOutput> {
    if (
      !input ||
      typeof input.refreshToken !== 'string' ||
      input.refreshToken.length === 0
    ) {
      throw this.invalidRefreshToken();
    }
    if (typeof input.refreshToken !== 'string') {
      throw this.invalidRefreshToken();
    }

    const now = this.now();

    const verifiedToken = await this.tokenIssuer.verifyRefreshToken(
      input.refreshToken,
    );
    if (!verifiedToken) {
      throw this.invalidRefreshToken();
    }

    const user = await this.repository.findUserById(verifiedToken.userId);
    if (!user || user.status !== 'ACTIVE') {
      await this.repository.revokeRefreshSessionFamily(
        verifiedToken.familyId,
        now,
      );
      throw this.invalidRefreshToken();
    }

    const refresh = await this.tokenIssuer.issueRefreshToken(
      user.id,
      verifiedToken.familyId,
    );
    const nextSession: NewAuthSession = {
      id: refresh.id,
      userId: user.id,
      familyId: verifiedToken.familyId,
      tokenHash: await this.tokenIssuer.hashRefreshToken(refresh.token),
      expiresAt: refresh.expiresAt,
    };
    const accessToken = await this.tokenIssuer.issueAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const incomingHash = await this.tokenIssuer.hashRefreshToken(
      input.refreshToken,
    );
    const rotation = await this.repository.rotateRefreshSession({
      tokenHash: incomingHash,
      expectedSessionId: verifiedToken.id,
      expectedUserId: verifiedToken.userId,
      expectedFamilyId: verifiedToken.familyId,
      consumedAt: now,
      nextSession,
    });

    if (rotation.kind !== 'rotated') {
      throw this.invalidRefreshToken();
    }

    return {
      accessToken,
      refreshToken: refresh.token,
      user: toPublicAuthUser(user),
    };
  }

  private invalidRefreshToken(): AuthApplicationError {
    return new AuthApplicationError(
      401,
      'INVALID_REFRESH_TOKEN',
      'Invalid refresh token',
    );
  }
}
