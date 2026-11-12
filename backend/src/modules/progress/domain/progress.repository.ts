export interface ProgressCounts {
  completedGuides: number;
  totalGuides: number;
  completedLessons: number;
  totalLessons: number;
}

export type TrackProgressResult = 'tracked' | 'not-found';

export interface ProgressRepository {
  getCounts(userId: string): Promise<ProgressCounts>;
  markGuideRead(userId: string, guideId: string): Promise<TrackProgressResult>;
  markLessonCompleted(
    userId: string,
    lessonId: string,
  ): Promise<TrackProgressResult>;
}
