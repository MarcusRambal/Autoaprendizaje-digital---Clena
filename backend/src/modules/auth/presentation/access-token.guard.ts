import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import type { TokenIssuer } from '../domain/token-issuer.port';
import { TOKEN_ISSUER } from '../infrastructure/prisma-auth.module';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_ISSUER)
    private readonly tokenIssuer: TokenIssuer,
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
    
    // El guard no sabe qué es JWT, solo le pide al dominio que verifique.
    const verifiedToken = await this.tokenIssuer.verifyAccessToken(token);
    
    if (!verifiedToken) {
      throw new UnauthorizedException('Invalid access token');
    }

    // Mapeamos la salida del TokenIssuer al request de Express
    request.user = {
      id: verifiedToken.userId,
      email: verifiedToken.email,
      role: verifiedToken.role,
    };

    return true;
  }
}