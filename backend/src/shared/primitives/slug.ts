/**
 * Turns a human title into a URL-friendly slug: lowercase, without accents,
 * with single hyphens. Returns an empty string when nothing usable remains.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
