export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type SortOrder = 'asc' | 'desc';

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Clamps untrusted page values into a safe range. */
export function normalizePageRequest(input: {
  page?: number;
  pageSize?: number;
}): PageRequest {
  return {
    page: Math.max(1, Math.trunc(input.page ?? 1)),
    pageSize: Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(input.pageSize ?? DEFAULT_PAGE_SIZE)),
    ),
  };
}

export function buildPage<T>(
  items: T[],
  total: number,
  request: PageRequest,
): Page<T> {
  return {
    items,
    page: request.page,
    pageSize: request.pageSize,
    total,
    totalPages: Math.ceil(total / request.pageSize),
  };
}
