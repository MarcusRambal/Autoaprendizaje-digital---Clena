import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../shared/database/prisma.service';
import { BcryptCredentialHasher } from './bcrypt-credential-hasher';
import { JwtTokenIssuer } from './jwt-token-issuer';
import { PrismaAuthRepository } from './prisma-auth.repository';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
export const CREDENTIAL_HASHER = Symbol('CREDENTIAL_HASHER');
export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

@Module({
  imports: [JwtModule.register({})],
  providers: [
    PrismaService,
    PrismaAuthRepository,
    {
      provide: AUTH_REPOSITORY,
      useExisting: PrismaAuthRepository,
    },
    {
      provide: BcryptCredentialHasher,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new BcryptCredentialHasher(config),
    },
    {
      provide: JwtTokenIssuer,
      inject: [ConfigService, JwtService],
      useFactory: (config: ConfigService, jwt: JwtService) =>
        new JwtTokenIssuer(config, jwt),
    },
    {
      provide: CREDENTIAL_HASHER,
      useExisting: BcryptCredentialHasher,
    },
    {
      provide: TOKEN_ISSUER,
      useExisting: JwtTokenIssuer,
    },
  ],
  exports: [
    PrismaService,
    PrismaAuthRepository,
    BcryptCredentialHasher,
    JwtTokenIssuer,
    AUTH_REPOSITORY,
    CREDENTIAL_HASHER,
    TOKEN_ISSUER,
  ],
})
export class PrismaAuthModule {}
