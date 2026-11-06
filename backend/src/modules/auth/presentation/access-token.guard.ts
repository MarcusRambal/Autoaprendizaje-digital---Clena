import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUserRole } from '../domain/auth-user';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: AuthUserRole;
}

const roles: AuthUserRole[] = ['PUBLIC_USER', 'STAFF', 'ADMIN'];

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(
        token,
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          algorithms: ['HS256'],
        },
      );
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        !roles.includes(payload.role as AuthUserRole)
      ) {
        throw new UnauthorizedException('Invalid access token');
      }
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as AuthUserRole,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
