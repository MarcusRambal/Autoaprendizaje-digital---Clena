import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './application/login.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { RefreshUseCase } from './application/refresh.use-case';
import { RegisterUseCase } from './application/register.use-case';
import type { AuthRepository } from './domain/auth.repository';
import type { CredentialHasher } from './domain/credential-hasher.port';
import { TOKEN_ISSUER, type TokenIssuer } from './domain/token-issuer.port';
import {
  AUTH_REPOSITORY,
  CREDENTIAL_HASHER,
  PrismaAuthModule,
} from './infrastructure/prisma-auth.module';
import { AccessTokenGuard } from './presentation/access-token.guard';
import { AuthController } from './presentation/auth.controller';
import { AuthThrottleGuard } from './presentation/auth-throttle.guard';
import { RolesGuard } from './presentation/roles.guard';

@Module({
  imports: [JwtModule.register({}), PrismaAuthModule],
  controllers: [AuthController],
  providers: [
    {
      provide: RegisterUseCase,
      inject: [AUTH_REPOSITORY, CREDENTIAL_HASHER],
      useFactory: (
        repository: AuthRepository,
        credentialHasher: CredentialHasher,
      ) => new RegisterUseCase(repository, credentialHasher),
    },
    {
      provide: LoginUseCase,
      inject: [AUTH_REPOSITORY, CREDENTIAL_HASHER, TOKEN_ISSUER],
      useFactory: (
        repository: AuthRepository,
        credentialHasher: CredentialHasher,
        tokenIssuer: TokenIssuer,
      ) => new LoginUseCase(repository, credentialHasher, tokenIssuer),
    },
    {
      provide: RefreshUseCase,
      inject: [AUTH_REPOSITORY, TOKEN_ISSUER],
      useFactory: (repository: AuthRepository, tokenIssuer: TokenIssuer) =>
        new RefreshUseCase(repository, tokenIssuer),
    },
    {
      provide: LogoutUseCase,
      inject: [AUTH_REPOSITORY, TOKEN_ISSUER],
      useFactory: (repository: AuthRepository, tokenIssuer: TokenIssuer) =>
        new LogoutUseCase(repository, tokenIssuer),
    },
    AuthThrottleGuard,
    AccessTokenGuard,
    RolesGuard,
  ],
  exports: [AccessTokenGuard, RolesGuard],
})
export class AuthModule {}
