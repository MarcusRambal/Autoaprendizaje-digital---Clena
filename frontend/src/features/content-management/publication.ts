export function togglePublished(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
}
