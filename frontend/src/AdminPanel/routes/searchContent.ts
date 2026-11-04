const normalizeSearch = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

export const matchesSearch = (query: string, ...values: string[]) => {
  const normalizedQuery = normalizeSearch(query);
  return values.some(value => normalizeSearch(value).includes(normalizedQuery));
};
