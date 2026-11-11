import { PageRequest, SortOrder } from '../../../shared/primitives/pagination';
import {
  Guide,
  GuideFileContent,
  GuidePublicationState,
  ManagedPublicationState,
  NewGuideFile,
} from './guide';

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
  /** Case-insensitive fragment that the guide title must contain. */
  search?: string;
  /** Only guides in this state; every state when omitted. */
  publicationState?: GuidePublicationState;
  order: SortOrder;
}

export interface GuidePage {
  items: Guide[];
  total: number;
}

export type CreateGuideResult =
  { kind: 'created'; guide: Guide } | { kind: 'category-not-found' };

/** Visibility of a read. By default only PUBLISHED guides are returned. */
export interface GuideReadOptions {
  includeUnpublished?: boolean;
}

export type SetPublicationResult =
  { kind: 'updated'; guide: Guide } | { kind: 'not-found' };

export type UpdateGuideResult =
  | { kind: 'updated'; guide: Guide }
  | { kind: 'not-found' }
  | { kind: 'category-not-found' };

export interface GuideRepository {
  create(input: NewGuide): Promise<CreateGuideResult>;
  list(query: ListGuidesQuery): Promise<GuidePage>;
  findById(id: string, options?: GuideReadOptions): Promise<Guide | null>;
  findFile(
    id: string,
    options?: GuideReadOptions,
  ): Promise<GuideFileContent | null>;
  update(id: string, changes: GuideChanges): Promise<UpdateGuideResult>;
  setPublication(
    id: string,
    state: ManagedPublicationState,
  ): Promise<SetPublicationResult>;
  /** Deletes the guide together with its PDF and steps. */
  delete(id: string): Promise<'deleted' | 'not-found'>;
}
