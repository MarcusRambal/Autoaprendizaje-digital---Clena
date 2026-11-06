import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthUserRole } from '../domain/auth-user';

const ROLES_KEY = 'auth:roles';

export const Roles = (...roles: AuthUserRole[]) =>
  SetMetadata(ROLES_KEY, roles);

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<Request & { user?: unknown }>().user,
);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AuthUserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { role?: AuthUserRole } }>();
    if (!request.user || !roles.includes(request.user.role as AuthUserRole)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
