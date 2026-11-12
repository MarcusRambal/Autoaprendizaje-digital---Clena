import {
  ProgressActivity,
  ProgressRepository,
} from '../domain/progress.repository';

export interface ProgressSection {
  completed: number;
  total: number;
  percentage: number;
  activities: ProgressActivity[];
}

export interface MyProgress {
  guides: ProgressSection;
  lessons: ProgressSection;
}

function toSection(activities: ProgressActivity[]): ProgressSection {
  const completed = activities.filter((activity) => activity.completed).length;
  const total = activities.length;
  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    activities,
  };
}

export class GetMyProgressUseCase {
  constructor(private readonly repository: ProgressRepository) {}

  async execute(userId: string): Promise<MyProgress> {
    const activities = await this.repository.getActivities(userId);
    return {
      guides: toSection(activities.guides),
      lessons: toSection(activities.lessons),
    };
  }
}
