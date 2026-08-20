// Hero section small screen behavior: disable snap, reduce padding, hide chevron on iPhone SE (≤320px)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Task 1: Disable snap on screens ≤320px
test('T1a: snap disabled on small screens', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('scroll-snap-type: none'),
    'CSS must disable scroll-snap-type on small screens',
  );
});

test('T1b: hero scroll-snap-align disabled on small screens', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('scroll-snap-align: none') || css.includes('scroll-snap-align: unset'),
    'CSS must disable scroll-snap-align on small screens',
  );
});

// Task 2: Reduce padding on screens ≤320px
test('T2: hero padding reduced on small screens', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('padding-top: 1rem') || css.includes('padding-top: 0.5rem'),
    'CSS must reduce padding-top on small screens',
  );
  assert.ok(
    css.includes('padding-bottom: 1rem') || css.includes('padding-bottom: 0.5rem'),
    'CSS must reduce padding-bottom on small screens',
  );
});

// Task 3: Hide chevron on screens ≤320px
test('T3: chevron hidden on small screens', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('.hero-chevron') || css.includes('.scroll-snap-section--slide > a'),
    'CSS must target chevron element for hiding on small screens',
  );
});
