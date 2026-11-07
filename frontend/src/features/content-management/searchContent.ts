const normalizeSearch = (value: string) =>
  value.toLocaleLowerCase().normalize('NFD')
    .replace(/n\u0303/g, 'ñ')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const matchesSearch = (query: string, ...values: string[]) => {
  const normalizedQuery = normalizeSearch(query);
  return values.some(value => normalizeSearch(value).includes(normalizedQuery));
};
