export interface User {
  email: string;
  userRole: 'admin' | 'student';
  token?: string;
  [key: string]: any;
}