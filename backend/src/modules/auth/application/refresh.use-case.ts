import { AuthApplicationError } from './auth-application.error';
import { AuthRepository } from '../domain/auth.repository';
import { NewAuthSession } from '../domain/auth-session';
import { PublicAuthUser, toPublicAuthUser } from '../domain/auth-user';
import { TokenIssuer } from '../domain/token-issuer.port';

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshOutput {
  accessToken: string;
  refreshToken: string;
  user: PublicAuthUser;
}

export class RefreshUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenIssuer: TokenIssuer,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: RefreshInput): Promise<RefreshOutput> {
    const now = this.now();
    const verifiedToken = await this.tokenIssuer.verifyRefreshToken(
      input.refreshToken,
    );
    if (!verifiedToken) {
      throw this.invalidRefreshToken();
    }

    const tokenHash = await this.tokenIssuer.hashRefreshToken(
      input.refreshToken,
    );
    const user = await this.repository.findUserById(verifiedToken.userId);
    if (!user) {
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
    const accessToken = await this.tokenIssuer.issueAccessToken(user);
    const rotation = await this.repository.rotateRefreshSession({
      tokenHash,
      expectedSessionId: verifiedToken.id,
      expectedUserId: verifiedToken.userId,
      expectedFamilyId: verifiedToken.familyId,
      consumedAt: now,
      nextSession,
    });

    if (rotation.kind === 'replayed') {
      throw this.invalidRefreshToken();
    }
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
