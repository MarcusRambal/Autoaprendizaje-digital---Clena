import { ProgressRepository } from '../domain/progress.repository';
import { ProgressApplicationError } from './progress-application.error';

export class CompleteLessonProgressUseCase {
  constructor(private readonly repository: ProgressRepository) {}

  async execute(userId: string, lessonId: string): Promise<void> {
    const result = await this.repository.markLessonCompleted(userId, lessonId);
    if (result === 'not-found') {
      throw new ProgressApplicationError(
        404,
        'LESSON_NOT_FOUND',
        'Published lesson not found',
      );
    }
  }
}
