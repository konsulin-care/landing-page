// Hero image breakpoint: hide on screens with height < 400px
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('T1: hero image hides on screens with height < 400px', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('@media (max-height: 399px)'),
    'CSS must use max-height: 399px to hide hero image',
  );
  assert.ok(
    css.includes('.hero-image-wrapper') && css.includes('display: none'),
    'CSS must hide .hero-image-wrapper on small height screens',
  );
});
