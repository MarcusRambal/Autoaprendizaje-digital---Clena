import {
  buildPage,
  normalizePageRequest,
  Page,
  SortOrder,
} from '../../../shared/primitives/pagination';
import { Lesson } from '../domain/lesson';
import { LessonRepository } from '../domain/lesson.repository';

export interface ListLessonsInput {
  page?: number;
  pageSize?: number;
  order?: SortOrder;
}

export class ListLessonsUseCase {
  constructor(private readonly repository: LessonRepository) {}

  async execute(input: ListLessonsInput): Promise<Page<Lesson>> {
    const request = normalizePageRequest(input);
    const { items, total } = await this.repository.list({
      ...request,
      order: input.order ?? 'desc',
    });
    return buildPage(items, total, request);
  }
}
