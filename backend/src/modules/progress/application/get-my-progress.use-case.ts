import { ProgressRepository } from '../domain/progress.repository';

export interface ProgressSection {
  completed: number;
  total: number;
  percentage: number;
}

export interface MyProgress {
  guides: ProgressSection;
  lessons: ProgressSection;
}

function toSection(completed: number, total: number): ProgressSection {
  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export class GetMyProgressUseCase {
  constructor(private readonly repository: ProgressRepository) {}

  async execute(userId: string): Promise<MyProgress> {
    const counts = await this.repository.getCounts(userId);
    return {
      guides: toSection(counts.completedGuides, counts.totalGuides),
      lessons: toSection(counts.completedLessons, counts.totalLessons),
    };
  }
}
