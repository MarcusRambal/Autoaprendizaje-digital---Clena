export function togglePublished<T extends number | string>(ids: T[], id: T): T[] {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
}
