// Mobile-only centering and responsive line-height
//   M1  Text centering is mobile-only (reverts to left on desktop)
//   M2  Paragraph line-height is responsive (tighter on mobile)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── M1 Centering is mobile-only ────────────────────────────────────
test('M1a: hero text div has text-center md:text-left', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('text-center md:text-left'),
    'hero text div must use "text-center md:text-left" (centered on mobile, left on desktop)',
  );
});

test('M1b: why-it-matters text div has text-center md:text-left', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('text-center md:text-left'),
    'why-it-matters text div must use "text-center md:text-left" (centered on mobile, left on desktop)',
  );
});

// ── M2 Responsive line-height ──────────────────────────────────────
test('M2a: hero paragraphs use leading-6 md:leading-8', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('leading-6 md:leading-8'),
    'hero paragraphs must use "leading-6 md:leading-8" (tighter on mobile, spacious on desktop)',
  );
});

test('M2b: why-it-matters paragraphs use leading-6 md:leading-8', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('leading-6 md:leading-8'),
    'why-it-matters paragraphs must use "leading-6 md:leading-8" (tighter on mobile, spacious on desktop)',
  );
});

test('M2c: hero paragraphs do not have standalone leading-8', () => {
  const hero = read('layouts/partials/home-hero.html');
  // Should have leading-6 md:leading-8, not just leading-8
  assert.ok(
    !hero.match(/leading-8(?!\s)/) || hero.includes('leading-6 md:leading-8'),
    'hero must use responsive line-height, not standalone leading-8',
  );
});

test('M2d: why-it-matters paragraphs do not have standalone leading-8', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    !partial.match(/leading-8(?!\s)/) || partial.includes('leading-6 md:leading-8'),
    'why-it-matters must use responsive line-height, not standalone leading-8',
  );
});
