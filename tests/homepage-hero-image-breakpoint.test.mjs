// Hero image breakpoint: only hide on screens smaller than iPhone SE (320px)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('T1: hero image hides only below 320px (not 640px)', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('@media (max-width: 319px)'),
    'CSS must use max-width: 319px to hide hero image (iPhone SE 320px can still show it)',
  );
  assert.ok(
    !css.includes('@media (max-width: 640px)') || !css.match(/@media \(max-width: 640px\)[^}]*\.hero-image-wrapper/),
    'CSS must not use max-width: 640px to hide hero image',
  );
});
