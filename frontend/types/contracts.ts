export interface User {
  email: string;
  userRole: 'admin' | 'student';
  token?: string;
  [key: string]: unknown;
}

export interface Category {
  id: number | string;
  title: string;
}

export type Guide = {
  id: number | string;
  title: string;
  file: string | File;
  category: string;
  categoryId?: number | string;
  fileUrl?: string | null;
};

export interface QuizQuestion {
  description: string;
  options: string[];
  correctOptionIndex: number;
  immediateFeedback: string;
}

export interface Quiz {
  id: number | string;
  name: string;
  description: string;
  category: string;
  categoryId?: number | string;
  questions: QuizQuestion[];
}

export type RequestStatus = 'Pendiente' | 'En Atención' | 'Atendida';

export interface HelpRequest {
  id: number | string;
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