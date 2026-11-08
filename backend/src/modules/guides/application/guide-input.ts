import {
  GUIDE_FILE_MAX_BYTES,
  GUIDE_TITLE_MAX_LENGTH,
  NewGuideFile,
} from '../domain/guide';
import { GuideApplicationError } from './guide-application.error';

export interface GuideFileInput {
  originalName: string;
  content: Uint8Array;
}

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const FILE_NAME_MAX_LENGTH = 200;

export function parseGuideTitle(rawTitle: string): string {
  const title = rawTitle.trim();
  if (!title || title.length > GUIDE_TITLE_MAX_LENGTH) {
    throw new GuideApplicationError(
      400,
      'INVALID_GUIDE',
      `Title must have between 1 and ${GUIDE_TITLE_MAX_LENGTH} characters`,
    );
  }
  return title;
}

/**
 * Accepts only real PDFs: the content must start with the PDF signature
 * (the client-reported type is not trusted) and fit the size limit.
 */
export function parseGuideFile(file: GuideFileInput): NewGuideFile {
  const { content } = file;
  if (content.length === 0) {
    throw new GuideApplicationError(
      400,
      'INVALID_GUIDE_FILE',
      'The PDF file is empty',
    );
  }
  if (content.length > GUIDE_FILE_MAX_BYTES) {
    throw new GuideApplicationError(
      400,
      'INVALID_GUIDE_FILE',
      `The PDF file cannot be larger than ${GUIDE_FILE_MAX_BYTES / (1024 * 1024)} MB`,
    );
  }
  if (!PDF_SIGNATURE.every((byte, index) => content[index] === byte)) {
    throw new GuideApplicationError(
      400,
      'INVALID_GUIDE_FILE',
      'The file must be a PDF document',
    );
  }
  return { originalName: sanitizeFileName(file.originalName), content };
}

function sanitizeFileName(rawName: string): string {
  const baseName = rawName.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const cleaned = baseName.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (cleaned || 'guia.pdf').slice(0, FILE_NAME_MAX_LENGTH);
}
