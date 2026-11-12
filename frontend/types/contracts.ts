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
  immediateFeedback?: string;
}

export interface Quiz {
  id: number | string;
  name: string;
  description?: string;
  category: string;
  categoryId?: string;
  questions: QuizQuestion[];
}

export type RequestStatus = 'Pendiente' | 'En Atención' | 'Atendida' | 'Cancelada';

export interface HelpRequest {
  id: number | string;
  requesterName: string | null;
  requesterEmail?: string | null;
  topic: string;
  description?: string;
  date: string;
  status: RequestStatus;
  createdAt?: string;
  attendedAt?: string | null;
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