import { LessonRepository } from '../domain/lesson.repository';
import { LessonApplicationError } from './lesson-application.error';

export class DeleteLessonUseCase {
  constructor(private readonly repository: LessonRepository) {}

  async execute(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result === 'not-found') {
      throw new LessonApplicationError(
        404,
        'LESSON_NOT_FOUND',
        'Lesson not found',
      );
    }
    if (result === 'has-progress') {
      throw new LessonApplicationError(
        409,
        'LESSON_HAS_PROGRESS',
        'This lesson cannot be deleted because learners already have progress for it',
      );
    }
  }
}
