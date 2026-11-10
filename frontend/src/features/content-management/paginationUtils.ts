export const PAGE_SIZE = 6;

export function getPage<T>(items: T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return {
    page,
    totalPages,
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  };
}
