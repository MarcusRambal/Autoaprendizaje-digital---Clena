import { PageRequest, SortOrder } from '../../../shared/primitives/pagination';
import { Lesson, LessonContentInput, LessonPublicationState } from './lesson';

export interface LessonPage {
  items: Lesson[];
  total: number;
}

export interface ListLessonsQuery extends PageRequest {
  order: SortOrder;
  publicationState?: LessonPublicationState;
}

export type CreateLessonResult =
  { kind: 'created'; lesson: Lesson } | { kind: 'category-not-found' };

export type UpdateLessonResult =
  | { kind: 'updated'; lesson: Lesson }
  | { kind: 'not-found' }
  | { kind: 'category-not-found' }
  | { kind: 'questions-locked' };

export type DeleteLessonResult = 'deleted' | 'not-found' | 'has-progress';

export interface LessonRepository {
  create(input: LessonContentInput): Promise<CreateLessonResult>;
  list(query: ListLessonsQuery): Promise<LessonPage>;
  findPublishedById(id: string): Promise<Lesson | null>;
  update(id: string, input: LessonContentInput): Promise<UpdateLessonResult>;
  delete(id: string): Promise<DeleteLessonResult>;
}
