import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthUserRole } from '../domain/auth-user';
import { AccessTokenGuard } from './access-token.guard';
import { Roles, RolesGuard } from './roles.guard';

/**
 * Requires a valid access token. When roles are given, the caller must have
 * one of them; with no roles, any signed-in user is allowed.
 */
export function Authorize(...roles: AuthUserRole[]) {
  return applyDecorators(
    UseGuards(AccessTokenGuard, RolesGuard),
    Roles(...roles),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ...(roles.length
      ? [
          ApiForbiddenResponse({
            description: `Requires one of these roles: ${roles.join(', ')}`,
          }),
        ]
      : []),
  );
}
