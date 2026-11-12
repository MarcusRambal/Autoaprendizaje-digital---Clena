import { apiClient } from "./apiClient.ts";
import type {
  PublicLesson,
  PublicLessonAnswerResult,
  PublicLessonSummary,
} from "./publicLearning";

interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiLessonSummary {
  id: string;
  title: string;
  description: string;
  category: string | null;
}

interface ApiLessonQuestion {
  id: string;
  orderNumber: number;
  prompt: string;
  choices: string[];
}

interface ApiLesson extends ApiLessonSummary {
  questions: ApiLessonQuestion[];
}

export function mapPublicLessonSummary(
  lesson: ApiLessonSummary,
): PublicLessonSummary {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    category: lesson.category ?? "",
  };
}

export function mapPublicLesson(lesson: ApiLesson): PublicLesson {
  return {
    ...mapPublicLessonSummary(lesson),
    questions: lesson.questions.map((question) => ({
      id: question.id,
      orderNumber: question.orderNumber,
      prompt: question.prompt,
      options: question.choices,
    })),
  };
}

export async function getPublicLessons(): Promise<PublicLessonSummary[]> {
  const pageSize = 100;
  const firstPage = await apiClient<PageResponse<ApiLessonSummary>>(
    `/public/lessons?page=1&pageSize=${pageSize}`,
  );
  const lessons = firstPage.items.map(mapPublicLessonSummary);

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await apiClient<PageResponse<ApiLessonSummary>>(
      `/public/lessons?page=${page}&pageSize=${pageSize}`,
    );
    lessons.push(...result.items.map(mapPublicLessonSummary));
  }

  return lessons;
}

export async function getPublicLesson(
  lessonId: number | string,
): Promise<PublicLesson> {
  const lesson = await apiClient<ApiLesson>(
    `/lessons/${encodeURIComponent(lessonId)}/public`,
  );
  return mapPublicLesson(lesson);
}

export function checkPublicLessonAnswer(
  lessonId: number | string,
  questionId: string,
  selectedOptionIndex: number,
): Promise<PublicLessonAnswerResult> {
  return apiClient<PublicLessonAnswerResult>(
    `/lessons/${encodeURIComponent(lessonId)}/check-answer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedOptionIndex }),
    },
  );
}
