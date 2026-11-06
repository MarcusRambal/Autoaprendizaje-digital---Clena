export type UserRole = 'ADMIN' | 'STAFF' | 'PUBLIC_USER';
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
}
