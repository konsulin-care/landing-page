// Homepage layout tests: mobile centering, alternating desktop layout, responsive fonts, justified text
//   L1  Hero mobile layout: image first, text centered, paragraphs justified
//   L2  Hero desktop layout unchanged: text left, image right
//   L3  Why-it-matters alternating layout: image left, text right on desktop
//   L4  Why-it-matters mobile: image first, text centered, paragraphs justified
//   L5  Responsive font scale: hero title one step larger than section titles
//   L6  All body paragraphs use responsive font scale
//   L7  All paragraphs have text-justify
//   L8  Build succeeds
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── L1 Hero mobile layout ─────────────────────────────────────────
test('L1a: hero image div is visible on mobile (no hidden md:block)', () => {
  const hero = read('layouts/partials/home-hero.html');
  // Find the image div (contains order-1 md:order-2) and check it doesn't have hidden md:block
  const imageDivMatch = hero.match(/<div[^>]*order-1 md:order-2[^>]*>/);
  assert.ok(imageDivMatch, 'hero must have an image div with order-1 md:order-2');
  assert.ok(
    !imageDivMatch[0].includes('hidden'),
    'hero image div must not have "hidden" class — image must render on mobile',
  );
});

test('L1b: hero image has order-1 for mobile-first ordering', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('order-1'),
    'hero image div must include "order-1" to appear first on mobile',
  );
});

test('L1c: hero text div has order-2 for mobile-first ordering', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('order-2'),
    'hero text div must include "order-2" to appear after image on mobile',
  );
});

test('L1d: hero text div has text-center for mobile centering', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('text-center'),
    'hero text div must include "text-center" for mobile centering',
  );
});

test('L1e: hero paragraphs have text-justify', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('text-justify'),
    'hero paragraphs must include "text-justify"',
  );
});

// ── L2 Hero desktop layout unchanged ──────────────────────────────
test('L2a: hero text div has md:order-1 for desktop', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('md:order-1'),
    'hero text div must include "md:order-1" for desktop (text left)',
  );
});

test('L2b: hero image div has md:order-2 for desktop', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('md:order-2'),
    'hero image div must include "md:order-2" for desktop (image right)',
  );
});

// ── L3 Why-it-matters alternating layout ───────────────────────────
test('L3a: why-it-matters image div has md:order-1 for desktop (image left)', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('md:order-1'),
    'why-it-matters image div must include "md:order-1" for desktop (image left)',
  );
});

test('L3b: why-it-matters text div has md:order-2 for desktop (text right)', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  // The text div should have order-2 md:order-2
  assert.ok(
    partial.includes('md:order-2'),
    'why-it-matters text div must include "md:order-2" for desktop (text right)',
  );
});

// ── L4 Why-it-matters mobile layout ────────────────────────────────
test('L4a: why-it-matters text div has text-center for mobile centering', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('text-center'),
    'why-it-matters text div must include "text-center" for mobile centering',
  );
});

test('L4b: why-it-matters paragraph has text-justify', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('text-justify'),
    'why-it-matters paragraph must include "text-justify"',
  );
});

// ── L5 Responsive font scale ───────────────────────────────────────
test('L5a: hero title uses text-xl sm:text-2xl md:text-3xl lg:text-4xl', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('text-xl sm:text-2xl md:text-3xl lg:text-4xl'),
    'hero title must use "text-xl sm:text-2xl md:text-3xl lg:text-4xl"',
  );
});

test('L5b: why-it-matters title uses text-lg sm:text-xl md:text-2xl lg:text-3xl', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('text-lg sm:text-xl md:text-2xl lg:text-3xl'),
    'why-it-matters title must use "text-lg sm:text-xl md:text-2xl lg:text-3xl" (one step smaller than hero)',
  );
});

// ── L6 Responsive body paragraph font scale ────────────────────────
test('L6a: hero paragraphs use text-sm sm:text-base md:text-lg lg:text-xl', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('text-sm sm:text-base md:text-lg lg:text-xl'),
    'hero paragraphs must use "text-sm sm:text-base md:text-lg lg:text-xl"',
  );
});

test('L6b: why-it-matters paragraphs use text-sm sm:text-base md:text-lg lg:text-xl', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('text-sm sm:text-base md:text-lg lg:text-xl'),
    'why-it-matters paragraphs must use "text-sm sm:text-base md:text-lg lg:text-xl"',
  );
});

test('L6c: how-it-works card paragraphs use text-sm sm:text-base md:text-lg lg:text-xl', () => {
  const partial = read('layouts/partials/home-how-it-works.html');
  assert.ok(
    partial.includes('text-sm sm:text-base md:text-lg lg:text-xl'),
    'how-it-works card paragraphs must use "text-sm sm:text-base md:text-lg lg:text-xl"',
  );
});

test('L6d: claim-report body paragraphs use text-sm sm:text-base md:text-lg lg:text-xl', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    partial.includes('text-sm sm:text-base md:text-lg lg:text-xl'),
    'claim-report body paragraphs must use "text-sm sm:text-base md:text-lg lg:text-xl"',
  );
});

test('L6e: research-credibility card paragraphs use text-sm sm:text-base md:text-lg lg:text-xl', () => {
  const partial = read('layouts/partials/home-research-credibility.html');
  assert.ok(
    partial.includes('text-sm sm:text-base md:text-lg lg:text-xl'),
    'research-credibility card paragraphs must use "text-sm sm:text-base md:text-lg lg:text-xl"',
  );
});

test('L6f: final-cta paragraph uses text-sm sm:text-base md:text-lg lg:text-xl', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(
    partial.includes('text-sm sm:text-base md:text-lg lg:text-xl'),
    'final-cta paragraph must use "text-sm sm:text-base md:text-lg lg:text-xl"',
  );
});

// ── L7 All paragraphs have text-justify ────────────────────────────
test('L7a: how-it-works card paragraphs have text-justify', () => {
  const partial = read('layouts/partials/home-how-it-works.html');
  assert.ok(
    partial.includes('text-justify'),
    'how-it-works card paragraphs must include "text-justify"',
  );
});

test('L7b: claim-report body paragraphs have text-justify', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    partial.includes('text-justify'),
    'claim-report body paragraphs must include "text-justify"',
  );
});

test('L7c: research-credibility card paragraphs have text-justify', () => {
  const partial = read('layouts/partials/home-research-credibility.html');
  assert.ok(
    partial.includes('text-justify'),
    'research-credibility card paragraphs must include "text-justify"',
  );
});

test('L7d: final-cta paragraph has text-justify', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(
    partial.includes('text-justify'),
    'final-cta paragraph must include "text-justify"',
  );
});

// ── L8 Build succeeds ──────────────────────────────────────────────
test('L8: production build succeeds', () => {
  execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'pipe' });
  assert.ok(fs.existsSync(path.join(ROOT, 'public/index.html')), 'public/index.html must exist after build');
});
