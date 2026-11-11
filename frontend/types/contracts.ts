export interface User {
  email: string;
  userRole: 'admin' | 'student';
  token?: string;
  [key: string]: unknown;
}

export interface Category {
  id: string;
  title: string;
}

export type Guide = {
  id: number | string;
  title: string;
  file: string | File | null;
  category: string;
  categoryId?: string;
  fileUrl?: string | null;
  publicationState?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt?: string;
};

export interface QuizQuestion {
  description: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  id: number;
  name: string;
  category: string;
  questions: QuizQuestion[];
}

export type RequestStatus = 'Pendiente' | 'En Atención' | 'Atendida';

export interface HelpRequest {
  id: number;
  requesterName: string;
  topic: string;
  date: string;
  status: RequestStatus;
}

export interface StatItem {
  label: string;
  value: number;
}

export interface DashboardStats {
  totalRequests: number;
  resolvedRequests: number;
  topCategories: StatItem[];
  topGuides: StatItem[];
}