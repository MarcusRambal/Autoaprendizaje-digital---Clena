import { Lesson, LessonContentInput } from '../domain/lesson';
import { LessonRepository } from '../domain/lesson.repository';
import { LessonApplicationError } from './lesson-application.error';
import { parseLessonContent } from './lesson-input';

export class UpdateLessonUseCase {
  constructor(private readonly repository: LessonRepository) {}

  async execute(id: string, input: LessonContentInput): Promise<Lesson> {
    const result = await this.repository.update(id, parseLessonContent(input));
    if (result.kind === 'not-found') {
      throw new LessonApplicationError(
        404,
        'LESSON_NOT_FOUND',
        'Lesson not found',
      );
    }
    if (result.kind === 'category-not-found') {
      throw new LessonApplicationError(
        404,
        'CATEGORY_NOT_FOUND',
        'Category not found',
      );
    }
    if (result.kind === 'questions-locked') {
      throw new LessonApplicationError(
        409,
        'LESSON_QUESTIONS_LOCKED',
        'Questions cannot be changed because learners already have progress for this lesson',
      );
    }
    return result.lesson;
  }
}
