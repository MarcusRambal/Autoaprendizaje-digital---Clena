export type LessonPublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface LessonQuestion {
  id: string;
  orderNumber: number;
  prompt: string;
  choices: string[];
  correctOptionIndex: number;
  immediateFeedback: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  categoryTitle: string | null;
  publicationState: LessonPublicationState;
  questions: LessonQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonQuestionInput {
  prompt: string;
  choices: string[];
  correctOptionIndex: number;
  immediateFeedback: string;
}

export interface LessonContentInput {
  title: string;
  description: string;
  categoryId: string;
  questions: LessonQuestionInput[];
}

export const LESSON_TITLE_MAX_LENGTH = 120;
export const LESSON_DESCRIPTION_MAX_LENGTH = 2000;
export const LESSON_QUESTION_MAX_LENGTH = 1000;
export const LESSON_OPTION_MAX_LENGTH = 300;
export const LESSON_FEEDBACK_MAX_LENGTH = 1000;
export const LESSON_MAX_QUESTIONS = 8;
export const LESSON_OPTION_COUNT = 4;
