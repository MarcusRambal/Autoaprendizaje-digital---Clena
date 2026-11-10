// infrastructure/jwt-token-issuer.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { AuthUser, AuthUserRole } from '../domain/auth-user';
import {
  IssuedRefreshToken,
  TokenIssuer,
  VerifiedAccessToken,
  VerifiedRefreshToken,
} from '../domain/token-issuer.port';

const TTL_PATTERN = /^(?=.*[1-9])\d+(ms|s|m|h|d)$/;

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async issueAccessToken(
    user: Pick<AuthUser, 'id' | 'email' | 'role'>,
  ): Promise<string> {
    return this.jwt.signAsync(
      { email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        subject: user.id,
        jwtid: randomUUID(),
        expiresIn: this.getTtl('JWT_ACCESS_TTL'),
        algorithm: 'HS256',
      },
    );
  }

  async issueRefreshToken(
    userId: string,
    familyId?: string,
  ): Promise<IssuedRefreshToken> {
    const id = randomUUID();
    const nextFamilyId = familyId ?? randomUUID();
    const token = await this.jwt.signAsync(
      { familyId: nextFamilyId },
      {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        subject: userId,
        jwtid: id,
        expiresIn: this.getTtl('JWT_REFRESH_TTL'),
        algorithm: 'HS256',
      },
    );
    // decode() is typed as any; narrow it before reading the expiry.
    const payload: unknown = this.jwt.decode(token);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number'
    ) {
      throw new Error('Refresh JWT is missing its expiry');
    }
    return {
      id,
      familyId: nextFamilyId,
      token,
      expiresAt: new Date(payload.exp * 1000),
    };
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<VerifiedRefreshToken | null> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(
        token,
        {
          secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
          algorithms: ['HS256'],
          ignoreExpiration: true,
        },
      );
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.jti !== 'string' ||
        typeof payload.familyId !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        return null;
      }
      return {
        id: payload.jti,
        userId: payload.sub,
        familyId: payload.familyId,
      };
    } catch {
      return null;
    }
  }

  async verifyAccessToken(token: string): Promise<VerifiedAccessToken | null> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(
        token,
        {
          secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
          algorithms: ['HS256'],
        },
      );
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        !isAuthUserRole(payload.role)
      ) {
        return null;
      }
      return { userId: payload.sub, email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  }

  hashRefreshToken(token: string): Promise<string> {
    return Promise.resolve(createHash('sha256').update(token).digest('hex'));
  }

  private getTtl(
    key: 'JWT_ACCESS_TTL' | 'JWT_REFRESH_TTL',
  ): JwtSignOptions['expiresIn'] {
    const raw = this.config.getOrThrow<string>(key);
    if (!TTL_PATTERN.test(raw)) {
      throw new Error(
        `${key} must be a positive duration with unit (ms|s|m|h|d), got: "${raw}"`,
      );
    }
    return raw as JwtSignOptions['expiresIn'];
  }
}

function isAuthUserRole(value: unknown): value is AuthUserRole {
  return value === 'ADMIN' || value === 'STAFF' || value === 'PUBLIC_USER';
}
