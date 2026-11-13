export interface ProgressActivity {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProgressActivities {
  guides: ProgressActivity[];
  lessons: ProgressActivity[];
}

export type TrackProgressResult = 'tracked' | 'not-found';

export interface ProgressRepository {
  getActivities(userId: string): Promise<ProgressActivities>;
  markGuideRead(userId: string, guideId: string): Promise<TrackProgressResult>;
  markLessonCompleted(
    userId: string,
    lessonId: string,
  ): Promise<TrackProgressResult>;
}
