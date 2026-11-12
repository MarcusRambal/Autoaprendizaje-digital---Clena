import assert from 'node:assert/strict';
import test from 'node:test';
import { mapPublicLesson } from '../services/publicLessonApi.ts';

test('mapea la respuesta de una lección publicada para el reproductor', () => {
  assert.deepEqual(mapPublicLesson({
    id: 'a72e2683-10a7-45f1-b7b7-7f3b2e09a225',
    title: 'Navegación segura',
    description: 'Aprende a navegar con seguridad.',
    category: 'Seguridad digital',
    questions: [{
      prompt: '¿Qué debes comprobar?',
      choices: ['A', 'B', 'C', 'D'],
      correctOptionIndex: 2,
      immediateFeedback: 'Verifica el origen antes de continuar.'
    }]
  }), {
    id: 'a72e2683-10a7-45f1-b7b7-7f3b2e09a225',
    title: 'Navegación segura',
    description: 'Aprende a navegar con seguridad.',
    category: 'Seguridad digital',
    questions: [{
      prompt: '¿Qué debes comprobar?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 2,
      explanation: 'Verifica el origen antes de continuar.'
    }]
  });
});

test('acepta lecciones sin categoría', () => {
  assert.equal(mapPublicLesson({
    id: 'lesson-id',
    title: 'Lección',
    description: 'Descripción',
    category: null,
    questions: []
  }).category, '');
});
