// Hero section snap mechanism: viewport fit, scroll-snap, keyboard nav
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Task 1: main element has scroll-snap-container class
test('T1a: main element has scroll-snap-container class', () => {
  const index = read('layouts/index.html');
  assert.ok(
    index.includes('scroll-snap-container'),
    '<main> must have class scroll-snap-container',
  );
});

// Task 2: CSS defines scroll-snap behavior
test('T2a: CSS defines scroll-snap-type on container', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('scroll-snap-type: y mandatory'),
    'CSS must define scroll-snap-type: y mandatory on container',
  );
});

test('T2b: CSS defines scroll-snap-align on hero section', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('scroll-snap-align: start'),
    'CSS must define scroll-snap-align: start on hero section',
  );
});

test('T2c: hero section has strict height 100svh', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('height: 100svh'),
    'Hero must use height: 100svh (strict fit, not min-height)',
  );
});

test('T2d: hero section hides image on small screens', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('.hero-image-wrapper') && css.includes('display: none'),
    'CSS must hide .hero-image-wrapper on small screens',
  );
});

// Task 3: hero HTML has correct structure
test('T3a: hero image container has hero-image-wrapper class', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('hero-image-wrapper'),
    'Hero image container must have hero-image-wrapper class',
  );
});

test('T3b: down chevron navigates to why-this-research-matters', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('href="#why-this-research-matters"'),
    'Down chevron must navigate to #why-this-research-matters',
  );
});

// Task 4: keyboard navigation JavaScript exists
test('T4a: index.html has keyboard navigation script', () => {
  const index = read('layouts/index.html');
  assert.ok(
    index.includes('ArrowDown'),
    'Must include keyboard handler for ArrowDown key',
  );
});

test('T4b: keyboard handler scrolls to next section', () => {
  const index = read('layouts/index.html');
  assert.ok(
    index.includes('scrollIntoView'),
    'Keyboard handler must use scrollIntoView to navigate',
  );
});
