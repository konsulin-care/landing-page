// Hero section updates: responsive headline, image fix, trust icons, remove trust strip
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// Task 1: Hero image uses proportional sizing (no forced aspect ratio)
test('T1a: hero image resize does not force 800x1000', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    !hero.includes('800x1000'),
    'hero must not use Resize "800x1000" — forces portrait crop on landscape image',
  );
});

test('T1b: hero image resize uses proportional height (800x0)', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('800x0') || hero.includes('800x') ,
    'hero resize should use proportional height (e.g. "800x0 webp q80")',
  );
});

// Task 2: Responsive headline — mobile-first sizing
test('T2a: hero headline has text-xl as base size', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('text-xl'),
    'hero headline must include text-xl for mobile base size',
  );
});

test('T2b: hero headline scales up at sm breakpoint', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('sm:text-2xl'),
    'hero headline must include sm:text-2xl',
  );
});

test('T2c: hero headline scales up at md breakpoint', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('md:text-3xl'),
    'hero headline must include md:text-3xl',
  );
});

test('T2d: hero headline scales up at lg breakpoint', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('lg:text-4xl'),
    'hero headline must include lg:text-4xl',
  );
});

// Task 3: Hero trust items are plain text (no icons), Alpine carousel for mobile
test('T3a: hero trust config items are plain strings (no icon field)', () => {
  const config = read('hugo.yaml');
  const heroIdx = config.indexOf('hero:');
  const trustIdx = config.indexOf('trust:', heroIdx);
  const heroSection = config.slice(trustIdx, trustIdx + 200);
  assert.ok(
    !heroSection.includes('icon:'),
    'hero.trust items must not include icon field (plain strings only)',
  );
});

test('T3b: hero trust uses Alpine carousel for mobile', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('x-data') && hero.includes('x-show'),
    'hero trust must use Alpine.js x-data and x-show for mobile carousel',
  );
});

test('T3c: hero trust has no SVG icons', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    !hero.includes('<svg'),
    'hero trust must not contain SVG icons (plain text only)',
  );
});

test('T3d: hero trust desktop uses inline middot separator', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('hidden md:block') && hero.includes('·'),
    'hero trust desktop must use hidden md:block with middot separator',
  );
});

// Task 4: Trust strip removed
test('T4a: index.html does not reference home-trust-strip', () => {
  const index = read('layouts/index.html');
  assert.ok(
    !index.includes('home-trust-strip'),
    'index.html must not reference home-trust-strip partial',
  );
});

test('T4b: trust_strip config removed from hugo.yaml', () => {
  const config = read('hugo.yaml');
  assert.ok(
    !config.includes('trust_strip'),
    'hugo.yaml must not contain trust_strip config',
  );
});

test('T4c: home-trust-strip.html is empty or removed', () => {
  if (exists('layouts/partials/home-trust-strip.html')) {
    const content = read('layouts/partials/home-trust-strip.html');
    assert.ok(
      content.trim().length === 0,
      'home-trust-strip.html must be empty (deleted) when removed from index.html',
    );
  }
  // If file doesn't exist, that's fine too
});

test('T4d: index.html has 6 sections (not 7)', () => {
  const index = read('layouts/index.html');
  const sectionCount = (index.match(/"partial"/g) ?? []).length;
  assert.equal(sectionCount, 6, 'index.html must define exactly 6 sections (trust strip removed)');
});
