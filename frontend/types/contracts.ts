export interface User {
  email: string;
  userRole: 'admin' | 'student';
  token?: string;
  [key: string]: any;
}

export type { Category, Guide } from './quizGuides';