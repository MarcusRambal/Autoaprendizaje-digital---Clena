import assert from 'node:assert/strict';
import test from 'node:test';
import { GUEST_LINKS, NAV_LINKS } from '../config/navConfig.ts';

test('visitantes y estudiantes acceden a guías sin una sección separada de seguridad', () => {
  for (const links of [GUEST_LINKS, NAV_LINKS.student]) {
    assert.ok(links.some(link => link.path === '/StudentsHome/Guides'));
    assert.ok(links.every(link => link.path !== '/StudentsHome/Security'));
  }
});

test('privacidad está disponible para cada rol autenticado y no para visitantes', () => {
  for (const [role, path] of [
    ['admin', '/Admin/Privacy'],
    ['staff', '/Staff/Privacy'],
    ['student', '/StudentsHome/Privacy'],
  ]) {
    assert.ok(NAV_LINKS[role].some(link => link.label === 'Privacidad' && link.path === path));
  }
  assert.ok(GUEST_LINKS.every(link => link.label !== 'Privacidad'));
});

test('ayuda está disponible en la navegación del estudiante autenticado', () => {
  assert.ok(NAV_LINKS.student.some(
    link => link.label === 'Ayuda' && link.path === '/StudentsHome/Help',
  ));
});
