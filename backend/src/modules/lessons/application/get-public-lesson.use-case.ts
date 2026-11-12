import { Lesson } from '../domain/lesson';
import { LessonRepository } from '../domain/lesson.repository';
import { LessonApplicationError } from './lesson-application.error';

export class GetPublicLessonUseCase {
  constructor(private readonly repository: LessonRepository) {}

  async execute(id: string): Promise<Lesson> {
    const lesson = await this.repository.findPublishedById(id);
    if (!lesson) {
      throw new LessonApplicationError(
        404,
        'LESSON_NOT_FOUND',
        'Lesson not found',
      );
    }
    return lesson;
  }
}
