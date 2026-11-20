import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers/html.mjs';

test('recognition signal cards use bg-card and never bg-background', () => {
  const partial = read('layouts/partials/home-recognition.html');
  assert.ok(partial.includes('bg-card'), 'recognition cards must use bg-card');
  assert.ok(!partial.includes('bg-background'), 'recognition partial must not use bg-background');
});
