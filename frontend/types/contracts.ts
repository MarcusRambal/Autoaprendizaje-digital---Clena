export interface User {
  email: string;
  userRole: 'admin' | 'student';
  token?: string;
  [key: string]: any;
}

export interface Category {
  id: number;
  title: string;
}

export type Guide = {
  id: number;
  title: string;
  file: string | File;
  category: string;
}