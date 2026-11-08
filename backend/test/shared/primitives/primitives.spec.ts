import {
  buildPage,
  normalizePageRequest,
} from '../../../src/shared/primitives/pagination';
import { slugify } from '../../../src/shared/primitives/slug';

describe('normalizePageRequest', () => {
  it('defaults to the first page of 20 items', () => {
    expect(normalizePageRequest({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('clamps out-of-range and fractional values', () => {
    expect(normalizePageRequest({ page: 0, pageSize: 1000 })).toEqual({
      page: 1,
      pageSize: 100,
    });
    expect(normalizePageRequest({ page: -3, pageSize: 0 })).toEqual({
      page: 1,
      pageSize: 1,
    });
    expect(normalizePageRequest({ page: 2.9, pageSize: 10.5 })).toEqual({
      page: 2,
      pageSize: 10,
    });
  });
});

describe('buildPage', () => {
  it('calculates the total number of pages', () => {
    expect(buildPage(['a'], 45, { page: 2, pageSize: 20 })).toEqual({
      items: ['a'],
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
    expect(buildPage([], 0, { page: 1, pageSize: 20 }).totalPages).toBe(0);
  });
});

describe('slugify', () => {
  it.each([
    ['Correo electrónico', 'correo-electronico'],
    ['  Redes   Sociales  ', 'redes-sociales'],
    ['¿Cómo creo mi CUENTA?', 'como-creo-mi-cuenta'],
    ['Ñandú & Año 2026', 'nandu-ano-2026'],
    ['???', ''],
  ])('turns %p into %p', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
