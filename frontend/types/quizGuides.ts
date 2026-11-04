export interface Category {
  id: number;
  title: string;
}

export type Guide = {
  id: number;
  title: string;
  file: string | File;
  category: string;
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
