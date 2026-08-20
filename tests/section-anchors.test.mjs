// 6-section homepage architecture (trust strip removed). Tests map 1:1 to the plan:
//   S1  layouts/index.html registers exactly 6 sections in order
//       (hero, why-this-research-matters, how-it-works,
//       claim-report, research-credibility, final-cta)
//   S2  JS scroll-snap machinery is gone: no scrollNavigation bindings,
//       no scroll-indicator partial, no carousel assets
//   S3  layouts/partials/scroll-section.html keeps semantic ids
//   S4  built HTML: 6 sections, no currentSection expressions
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ---------------------------------------------------------------- S1 ids in index.html

// num -> (partial, id)
const SECTION_IDS = {
  1: ['home-hero', 'hero'],
  2: ['home-why-it-matters', 'why-this-research-matters'],
  3: ['home-how-it-works', 'how-it-works'],
  4: ['home-claim-report', 'claim-report'],
  5: ['home-research-credibility', 'research-credibility'],
  6: ['home-final-cta', 'final-cta'],
};

test('S1a: each section dict in index.html carries a semantic id', () => {
  const index = read('layouts/index.html');
  for (const [num, [partial, id]] of Object.entries(SECTION_IDS)) {
    assert.ok(
      index.includes(`"id" "${id}"`) && index.includes(`"partial" "${partial}.html"`),
      `section ${num} must map id "${id}" to ${partial}.html`,
    );
  }
});

test('S1b: section ids are registered in ascending order', () => {
  const index = read('layouts/index.html');
  let prev = -1;
  for (const [num, [, id]] of Object.entries(SECTION_IDS)) {
    const pos = index.indexOf(`"id" "${id}"`);
    assert.ok(pos > prev, `section ${num} ("${id}") must appear after previous section`);
    prev = pos;
  }
});

test('S1c: index.html registers exactly 6 section partials', () => {
  const index = read('layouts/index.html');
  const matches = index.match(/"partial" "[^"]+"/g) ?? [];
  assert.equal(matches.length, 6, 'index.html must define exactly 6 sections');
});

// ---------------------------------------------------------------- S2 dead assets removed
test('S2a: index.html carries no scroll-snap bindings or dead assets', () => {
  const index = read('layouts/index.html');
  assert.ok(!index.includes('scrollNavigation'), 'no scrollNavigation in index.html');
  assert.ok(!index.includes('scroll-indicator'), 'no scroll-indicator in index.html');
  assert.ok(!index.includes('hero-rotator'), 'no hero-rotator in index.html');
});

// ---------------------------------------------------------------- S3 semantic ids
test('S3a: section element uses the semantic id, not section-N', () => {
  const partial = read('layouts/partials/scroll-section.html');
  assert.ok(
    partial.includes('id="{{ $id }}"') || partial.includes('id={{ $id }}'),
    'wrapper must emit id from the passed id key',
  );
  assert.ok(!partial.includes('id="section-'), 'no section-N ids');
});

test('S3b: sections carry no copy-link/share button', () => {
  const partial = read('layouts/partials/scroll-section.html');
  assert.ok(!partial.includes('copySectionLink'), 'no copy-link button');
});

// ---------------------------------------------------------------- S4 rendered output
let publicHtml = '';
before(async () => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe' });
  publicHtml = read('public/index.html');
});

test('S4a: rendered homepage has 6 semantic section ids', () => {
  for (const [num, [, id]] of Object.entries(SECTION_IDS)) {
    assert.ok(
      publicHtml.includes(`<section id="${id}"`) || publicHtml.includes(`<section id=${id} `),
      `rendered page must contain <section id="${id}"> (section ${num})`,
    );
  }
});

test('S4b: rendered page has exactly 6 snap-section elements', () => {
  const sections = (publicHtml.match(/scroll-snap-section(?=\s|["'>])/g) ?? []).length;
  assert.equal(sections, 6, 'rendered page must have exactly 6 snap sections');
});

test('S4c: no currentSection expressions in rendered output', () => {
  assert.ok(
    !publicHtml.includes('x-show="currentSection'),
    'no currentSection visibility expressions may render',
  );
  assert.ok(!publicHtml.includes('scrollNavigation'), 'no scrollNavigation in output');
});
