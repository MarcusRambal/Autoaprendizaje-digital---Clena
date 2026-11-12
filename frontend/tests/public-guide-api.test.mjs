import assert from 'node:assert/strict';
import test from 'node:test';
import { mapPublicGuide } from '../services/publicGuideApi.ts';

test('mapea la respuesta pública de guías y conserva la URL del PDF', () => {
  assert.deepEqual(mapPublicGuide({
    id: 'c9de1adc-2d13-4c12-8f25-c5e5069212de',
    title: 'Seguridad en línea',
    category: 'Seguridad digital',
    categoryId: '4bf74b18-9bef-4f75-b0c8-1de0a7f22115',
    file: 'seguridad.pdf',
    fileUrl: '/api/v1/guides/c9de1adc-2d13-4c12-8f25-c5e5069212de/file'
  }), {
    id: 'c9de1adc-2d13-4c12-8f25-c5e5069212de',
    title: 'Seguridad en línea',
    description: '',
    category: 'Seguridad digital',
    file: 'seguridad.pdf',
    fileUrl: '/api/v1/guides/c9de1adc-2d13-4c12-8f25-c5e5069212de/file'
  });
});

test('tolera una guía que aún no tiene archivo PDF', () => {
  assert.equal(mapPublicGuide({
    id: 'guide-id',
    title: 'Guía pendiente',
    category: 'Aprendizaje',
    categoryId: 'category-id',
    file: null,
    fileUrl: null
  }).fileUrl, null);
});
