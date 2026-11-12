export type GuidePublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** States the staff can move a guide to from the panel. */
export type ManagedPublicationState = Exclude<
  GuidePublicationState,
  'ARCHIVED'
>;

export interface Guide {
  id: string;
  title: string;
  /** Only PUBLISHED guides are visible to the public. */
  publicationState: GuidePublicationState;
  categoryId: string;
  categoryTitle: string;
  /** Original name of the attached PDF, or null when the guide has none. */
  fileName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewGuideFile {
  originalName: string;
  content: Uint8Array;
}

export interface GuideFileContent {
  fileName: string;
  contentType: string;
  content: Uint8Array;
}

export const GUIDE_TITLE_MAX_LENGTH = 120;
export const GUIDE_FILE_MAX_BYTES = 10 * 1024 * 1024;
