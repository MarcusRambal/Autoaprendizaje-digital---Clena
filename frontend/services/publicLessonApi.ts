import { apiClient } from './apiClient.ts';
import type { PublicLesson } from './publicLearning';

interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiLessonQuestion {
  prompt: string;
  choices: string[];
  correctOptionIndex: number;
  immediateFeedback: string;
}

interface ApiLesson {
  id: string;
  title: string;
  description: string;
  category: string | null;
  questions: ApiLessonQuestion[];
}

export function mapPublicLesson(lesson: ApiLesson): PublicLesson {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    category: lesson.category ?? '',
    questions: lesson.questions.map(question => ({
      prompt: question.prompt,
      options: question.choices,
      correctIndex: question.correctOptionIndex,
      explanation: question.immediateFeedback
    }))
  };
}

export async function getPublicLessons(): Promise<PublicLesson[]> {
  const pageSize = 100;
  const firstPage = await apiClient<PageResponse<ApiLesson>>(
    `/public/lessons?page=1&pageSize=${pageSize}`
  );
  const lessons = firstPage.items.map(mapPublicLesson);

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await apiClient<PageResponse<ApiLesson>>(
      `/public/lessons?page=${page}&pageSize=${pageSize}`
    );
    lessons.push(...result.items.map(mapPublicLesson));
  }

  return lessons;
}
