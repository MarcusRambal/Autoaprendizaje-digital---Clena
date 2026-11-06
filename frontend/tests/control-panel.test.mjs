import assert from 'node:assert/strict';
import test from 'node:test';
import { categories, guides, quizzes } from './fixtures/controlPanelData.ts';
import { matchesSearch } from '../src/AdminPanel/routes/searchContent.ts';

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
