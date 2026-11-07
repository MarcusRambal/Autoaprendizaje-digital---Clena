import assert from 'node:assert/strict';
import test from 'node:test';
import { togglePublished } from '../src/features/content-management/publication.ts';

test('publicar y despublicar cambia solo el contenido seleccionado', () => {
  const original = [1, 3];
  assert.deepEqual(togglePublished(original, 2), [1, 3, 2]);
  assert.deepEqual(togglePublished(original, 1), [3]);
  assert.deepEqual(original, [1, 3]);
});
