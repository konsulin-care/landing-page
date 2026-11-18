// Homepage surfaces: cards sit on bg-card and the footer body carries no colour.
//   F1  home-recognition.html signal cards use bg-card, never bg-background
//   F2  footer.html inline body style has no background-color and keeps its layout
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('F1: recognition signal cards use bg-card and never bg-background', () => {
  const partial = read('layouts/partials/home-recognition.html');
  assert.ok(partial.includes('bg-card'), 'recognition cards must use bg-card');
  assert.ok(!partial.includes('bg-background'), 'recognition partial must not use bg-background');
});

test('F2: footer inline body style sets no background-color and keeps flex layout', () => {
  const footer = read('layouts/partials/footer.html');
  assert.ok(!footer.includes('background-color'), 'footer must not set a body background-color');
  assert.ok(/display:\s*flex/.test(footer), 'body must keep display: flex');
  assert.ok(/flex-direction:\s*column/.test(footer), 'body must keep flex-direction: column');
  assert.ok(/min-height:\s*100vh/.test(footer), 'body must keep min-height: 100vh');
  assert.ok(/margin:\s*0/.test(footer), 'body must keep margin: 0');
});
