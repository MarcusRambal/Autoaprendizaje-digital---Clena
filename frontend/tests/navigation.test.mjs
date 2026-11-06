import assert from 'node:assert/strict';
import test from 'node:test';
import { GUEST_LINKS, NAV_LINKS } from '../config/navConfig.ts';

test('visitantes y estudiantes acceden a guías sin una sección separada de seguridad', () => {
  for (const links of [GUEST_LINKS, NAV_LINKS.student]) {
    assert.ok(links.some(link => link.path === '/StudentsHome/Guides'));
    assert.ok(links.every(link => link.path !== '/StudentsHome/Security'));
  }
});
