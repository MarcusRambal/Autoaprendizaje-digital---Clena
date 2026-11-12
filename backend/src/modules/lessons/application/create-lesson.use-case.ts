import { Lesson } from '../domain/lesson';
import { LessonRepository } from '../domain/lesson.repository';
import { LessonApplicationError } from './lesson-application.error';
import { parseLessonContent } from './lesson-input';

export class CreateLessonUseCase {
  constructor(private readonly repository: LessonRepository) {}

  async execute(
    input: Parameters<typeof parseLessonContent>[0],
  ): Promise<Lesson> {
    const result = await this.repository.create(parseLessonContent(input));
    if (result.kind === 'category-not-found') {
      throw new LessonApplicationError(
        404,
        'CATEGORY_NOT_FOUND',
        'Category not found',
      );
    }
    return result.lesson;
  }
}
