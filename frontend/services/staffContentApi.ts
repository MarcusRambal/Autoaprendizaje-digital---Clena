import { apiClient } from "./apiClient";
import type { Category, Guide, Quiz, QuizQuestion } from "../types/contracts";

interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiCategory {
  id: string;
  title: string;
}

interface ApiGuide {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  file: string | null;
  fileUrl: string | null;
}

interface ApiLessonQuestion {
  id: string;
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
  categoryId: string | null;
  questions: ApiLessonQuestion[];
}

export type ApiRequestStatus = "PENDING" | "IN_PROGRESS" | "ATTENDED";

export interface ApiHelpRequest {
  id: string;
  requesterName: string | null;
  topic: string;
  date: string;
  status: ApiRequestStatus;
  createdAt: string;
}

export type ApiHelpRequestPage = PageResponse<ApiHelpRequest>;

async function getAllPages<T>(endpoint: string): Promise<T[]> {
  const pageSize = 100;
  const firstPage = await apiClient<PageResponse<T>>(
    `${endpoint}?page=1&pageSize=${pageSize}`,
  );
  const items = [...firstPage.items];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await apiClient<PageResponse<T>>(
      `${endpoint}?page=${page}&pageSize=${pageSize}`,
    );
    items.push(...result.items);
  }
  return items;
}

function mapCategory(category: ApiCategory): Category {
  return { id: category.id, title: category.title };
}

function mapGuide(guide: ApiGuide): Guide {
  return {
    id: guide.id,
    title: guide.title,
    file: guide.file,
    category: guide.category,
    categoryId: guide.categoryId,
    fileUrl: guide.fileUrl,
  };
}

function mapQuestion(question: ApiLessonQuestion): QuizQuestion {
  return {
    description: question.prompt,
    options: question.choices,
    correctOptionIndex: question.correctOptionIndex,
    immediateFeedback: question.immediateFeedback,
  };
}

function mapLesson(lesson: ApiLesson): Quiz {
  return {
    id: lesson.id,
    name: lesson.title,
    description: lesson.description,
    category: lesson.category ?? "",
    categoryId: lesson.categoryId ?? undefined,
    questions: lesson.questions.map(mapQuestion),
  };
}

export async function listStaffContent(): Promise<{
  categories: Category[];
  guides: Guide[];
  lessons: Quiz[];
}> {
  const [categories, guides, lessons] = await Promise.all([
    getAllPages<ApiCategory>("/categories"),
    getAllPages<ApiGuide>("/guides"),
    getAllPages<ApiLesson>("/lessons"),
  ]);
  return {
    categories: categories.map(mapCategory),
    guides: guides.map(mapGuide),
    lessons: lessons.map(mapLesson),
  };
}

export async function createGuide(input: {
  title: string;
  categoryId: string;
  file: File;
}): Promise<Guide> {
  const body = new FormData();
  body.append("title", input.title);
  body.append("categoryId", input.categoryId);
  body.append("file", input.file);
  return mapGuide(
    await apiClient<ApiGuide>("/guides", { method: "POST", body }),
  );
}

export async function updateGuide(
  id: string,
  input: { title: string; categoryId: string; file?: File },
): Promise<Guide> {
  const body = new FormData();
  body.append("title", input.title);
  body.append("categoryId", input.categoryId);
  if (input.file) body.append("file", input.file);
  return mapGuide(
    await apiClient<ApiGuide>(`/guides/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    }),
  );
}

export function deleteGuide(id: string): Promise<void> {
  return apiClient<void>(`/guides/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export interface LessonInput {
  title: string;
  description: string;
  categoryId: string;
  questions: Array<{
    prompt: string;
    choices: string[];
    correctOptionIndex: number;
    immediateFeedback: string;
  }>;
}

export async function createLesson(input: LessonInput): Promise<Quiz> {
  return mapLesson(
    await apiClient<ApiLesson>("/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateLesson(
  id: string,
  input: LessonInput,
): Promise<Quiz> {
  return mapLesson(
    await apiClient<ApiLesson>(`/lessons/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export function deleteLesson(id: string): Promise<void> {
  return apiClient<void>(`/lessons/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function listHelpRequests(
  page: number,
  pageSize: number,
): Promise<ApiHelpRequestPage> {
  return apiClient<ApiHelpRequestPage>(
    `/help-requests?page=${page}&pageSize=${pageSize}`,
  );
}

export function createHelpRequest(input: {
  requesterName: string;
  topic: string;
}): Promise<ApiHelpRequest> {
  return apiClient<ApiHelpRequest>("/help-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateHelpRequestStatus(
  id: string,
  status: ApiRequestStatus,
): Promise<ApiHelpRequest> {
  return apiClient<ApiHelpRequest>(`/help-requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function deleteHelpRequest(id: string): Promise<void> {
  return apiClient<void>(`/help-requests/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function apiErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No fue posible completar la operación. Inténtalo de nuevo.";
}
