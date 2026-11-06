export type AuthUserRole = 'PUBLIC_USER' | 'STAFF' | 'ADMIN';
export type AuthUserStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: AuthUserRole;
  status: AuthUserStatus;
}

export type PublicAuthUser = Pick<AuthUser, 'id' | 'email' | 'role'>;

export function toPublicAuthUser(user: AuthUser): PublicAuthUser {
  return { id: user.id, email: user.email, role: user.role };
}
