import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessRoute } from './roleAccess.js';

test('admin can access admin-only routes', () => {
  assert.equal(canAccessRoute('admin', '/org-setup'), true);
  assert.equal(canAccessRoute('admin', '/audit-logs'), true);
});

test('hr cannot access admin-only routes', () => {
  assert.equal(canAccessRoute('hr', '/org-setup'), false);
  assert.equal(canAccessRoute('hr', '/audit-logs'), false);
});

test('employee cannot access hr/admin routes', () => {
  assert.equal(canAccessRoute('employee', '/employees'), false);
  assert.equal(canAccessRoute('employee', '/org-setup'), false);
});

test('employee can access personal routes', () => {
  assert.equal(canAccessRoute('employee', '/dashboard'), true);
  assert.equal(canAccessRoute('employee', '/profile'), true);
});
