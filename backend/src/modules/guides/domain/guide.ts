export interface Guide {
  id: string;
  title: string;
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
