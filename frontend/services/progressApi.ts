import { apiClient } from "./apiClient.ts";

export interface ProgressSection {
  completed: number;
  total: number;
  percentage: number;
}

export interface MyProgress {
  guides: ProgressSection;
  lessons: ProgressSection;
}

export function getMyProgress(): Promise<MyProgress> {
  return apiClient<MyProgress>("/progress/me");
}

export function markGuideRead(guideId: string): Promise<void> {
  return apiClient<void>(`/progress/guides/${encodeURIComponent(guideId)}/read`, {
    method: "POST",
  });
}

export function markLessonCompleted(lessonId: number | string): Promise<void> {
  return apiClient<void>(
    `/progress/lessons/${encodeURIComponent(String(lessonId))}/complete`,
    { method: "POST" },
  );
}
