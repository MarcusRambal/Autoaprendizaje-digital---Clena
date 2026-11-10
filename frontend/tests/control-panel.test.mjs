import assert from 'node:assert/strict';
import test from 'node:test';
import { categories, guides, quizzes } from './fixtures/controlPanelData.ts';
import { matchesSearch } from '../src/features/content-management/searchContent.ts';
import { getPage, PAGE_SIZE } from '../src/features/content-management/paginationUtils.ts';
import { isValidQuestion, MAX_QUESTIONS, OPTION_COUNT } from '../src/features/content-management/lessonValidation.ts';

test('los datos simulados son abundantes y mantienen sus relaciones', () => {
  assert.equal(categories.length, 26);
  assert.equal(guides.length, 208);
  assert.equal(quizzes.length, 104);
  for (const items of [categories, guides, quizzes]) {
    assert.equal(new Set(items.map(item => item.id)).size, items.length);
  }
  const titles = new Set(categories.map(category => category.title));
  assert.equal(titles.size, categories.length);
  for (const item of [...guides, ...quizzes]) {
    assert.ok(titles.has(item.category));
  }
  for (const quiz of quizzes) {
    assert.equal(quiz.questions.length, 5);
    for (const question of quiz.questions) {
      assert.ok(question.options[question.correctOptionIndex]);
    }
  }
});

test('busca por nombre o categoría sin distinguir mayúsculas ni tildes', () => {
  assert.equal(guides.filter(guide => matchesSearch('  NAVEGACION WEB  ', guide.title, guide.category)).length, 8);
  assert.equal(quizzes.filter(quiz => matchesSearch('EVALUACION 2', quiz.name, quiz.category)).length, 26);
  assert.equal(categories.filter(category => matchesSearch('no existe', category.title)).length, 0);
  assert.equal(guides.filter(guide => matchesSearch('   ', guide.title, guide.category)).length, guides.length);
});

test('distingue la ñ de la n y admite texto Unicode descompuesto', () => {
  assert.equal(matchesSearch('ninos', 'Tecnología para niños'), false);
  assert.equal(matchesSearch('NIN\u0303OS', 'Tecnología para niños'), true);
  assert.equal(matchesSearch('navegacion', 'Navegacio\u0301n web'), true);
});

test('pagina los resultados filtrados en grupos de seis y ajusta páginas fuera de rango', () => {
  assert.equal(PAGE_SIZE, 6);
  const filtered = guides.filter(guide => matchesSearch('navegacion web', guide.title, guide.category));
  assert.equal(getPage(filtered, 1).items.length, 6);
  assert.equal(getPage(filtered, 2).items.length, 2);
  assert.equal(getPage(filtered, 10).page, 2);
  assert.equal(getPage([], 3).page, 1);
  assert.equal(getPage([], 3).items.length, 0);
  assert.deepEqual(getPage(quizzes, 1).items, quizzes.slice(0, 6));
});

test('cada pregunta requiere exactamente cuatro opciones y una respuesta válida', () => {
  assert.equal(MAX_QUESTIONS, 8);
  assert.equal(OPTION_COUNT, 4);
  const question = { description: 'Pregunta', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 2 };
  question.immediateFeedback = 'Explicación';
  assert.equal(isValidQuestion(question), true);
  assert.equal(isValidQuestion({ ...question, description: ' ' }), false);
  assert.equal(isValidQuestion({ ...question, options: ['A', 'B', 'C'] }), false);
  assert.equal(isValidQuestion({ ...question, options: ['A', 'B', 'C', 'D', 'E'] }), false);
  assert.equal(isValidQuestion({ ...question, options: ['A', 'B', ' ', 'D'] }), false);
  assert.equal(isValidQuestion({ ...question, options: ['A', 'B', 'B', 'D'] }), false);
  assert.equal(isValidQuestion({ ...question, immediateFeedback: ' ' }), false);
  assert.equal(isValidQuestion({ ...question, correctOptionIndex: 4 }), false);
  assert.equal(isValidQuestion({ ...question, correctOptionIndex: 1.5 }), false);
});
