import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { AuthUser } from '../domain/auth-user';
import {
  IssuedRefreshToken,
  TokenIssuer,
  VerifiedRefreshToken,
} from '../domain/token-issuer.port';

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt = new JwtService(),
  ) {}

  async issueAccessToken(
    user: Pick<AuthUser, 'id' | 'email' | 'role'>,
  ): Promise<string> {
    return this.jwt.signAsync(
      { email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        subject: user.id,
        jwtid: randomUUID(),
        expiresIn: this.config.getOrThrow<string>(
          'JWT_ACCESS_TTL',
        ) as JwtSignOptions['expiresIn'],
      },
    );
  }

  async issueRefreshToken(
    userId: string,
    familyId?: string,
  ): Promise<IssuedRefreshToken> {
    const id = randomUUID();
    const nextFamilyId = familyId ?? randomUUID();
    const ttl = this.config.getOrThrow<string>('JWT_REFRESH_TTL');
    const token = await this.jwt.signAsync(
      { familyId: nextFamilyId },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        subject: userId,
        jwtid: id,
        expiresIn: ttl as JwtSignOptions['expiresIn'],
      },
    );
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
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
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

  hashRefreshToken(token: string): Promise<string> {
    return Promise.resolve(createHash('sha256').update(token).digest('hex'));
  }
}
