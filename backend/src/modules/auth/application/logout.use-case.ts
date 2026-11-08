import { AuthRepository } from '../domain/auth.repository';
import { TokenIssuer } from '../domain/token-issuer.port';

export interface LogoutInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenIssuer: TokenIssuer,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    if (
      typeof input?.refreshToken !== 'string' ||
      input.refreshToken.length === 0
    ) {
      // Nada que revocar: el cliente no tiene una sesión válida que cerrar.
      // Idempotente: no lanzamos.
      return;
    }

    const verifiedToken = await this.tokenIssuer.verifyRefreshToken(
      input.refreshToken,
    );
    if (!verifiedToken) {
      // Without a valid signature, there is no trustworthy family to revoke.
      return;
    }

    await this.repository.revokeRefreshSessionFamily(
      verifiedToken.familyId,
      this.now(),
    );
    // Éxito (o ya estaba revocada) → no-op. El controller devuelve 204.
  }
}
