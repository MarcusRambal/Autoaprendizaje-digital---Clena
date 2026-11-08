import { PageRequest, SortOrder } from '../../../shared/primitives/pagination';
import { Guide, GuideFileContent, NewGuideFile } from './guide';

export interface NewGuide {
  title: string;
  categoryId: string;
  file: NewGuideFile;
}

export interface GuideChanges {
  title?: string;
  categoryId?: string;
  file?: NewGuideFile;
}

export interface ListGuidesQuery extends PageRequest {
  categoryId?: string;
  order: SortOrder;
}

export interface GuidePage {
  items: Guide[];
  total: number;
}

export type CreateGuideResult =
  { kind: 'created'; guide: Guide } | { kind: 'category-not-found' };

export type UpdateGuideResult =
  | { kind: 'updated'; guide: Guide }
  | { kind: 'not-found' }
  | { kind: 'category-not-found' };

export interface GuideRepository {
  create(input: NewGuide): Promise<CreateGuideResult>;
  list(query: ListGuidesQuery): Promise<GuidePage>;
  findById(id: string): Promise<Guide | null>;
  findFile(id: string): Promise<GuideFileContent | null>;
  update(id: string, changes: GuideChanges): Promise<UpdateGuideResult>;
  /** Deletes the guide together with its PDF and steps. */
  delete(id: string): Promise<'deleted' | 'not-found'>;
}
