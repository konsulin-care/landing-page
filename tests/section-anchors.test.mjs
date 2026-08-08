// Shareable section anchors. Tests map 1:1 to the plan:
//   S1  layouts/index.html: 9 sections carry semantic ids (hero..join)
//   S2  layouts/partials/scroll-section.html: id="{{ $id }}", slide
//       modifier for the hero, no share/copy-link button (no section-N ids)
//   S3  assets/js/scroll-navigation.js: decoupled lookups, hash sync via
//       replaceState, deep-link handling on load, chevron/keyboard nav
//   S4  built HTML: <section id="hero">..<section id="join">, no copy
//       buttons, chevron x-show rules for hero (down) and section 2 (up)
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ---------------------------------------------------------------- S1 ids in index.html

// num -> (partial, id)
const SECTION_IDS = {
  1: ['home-hero', 'hero'],
  2: ['home-problem', 'problem'],
  3: ['home-participation', 'participation'],
  4: ['home-process', 'process'],
  5: ['home-transparency', 'transparency'],
  6: ['home-privacy', 'privacy'],
  7: ['home-collaboration', 'collaboration'],
  8: ['home-impact', 'impact'],
  9: ['home-cta', 'join'],
};

test('S1a: each section dict in index.html carries a semantic id', () => {
  const index = read('layouts/index.html');
  for (const [num, [partial, id]] of Object.entries(SECTION_IDS)) {
    assert.ok(
      index.includes(`"num" ${num} "id" "${id}" "partial" "${partial}.html"`),
      `section ${num} must map id "${id}" to ${partial}.html`,
    );
  }
});

test('S1b: section ids are registered in ascending order', () => {
  const index = read('layouts/index.html');
  let prev = -1;
  for (const [, [, id]] of Object.entries(SECTION_IDS)) {
    const at = index.indexOf(`"id" "${id}"`);
    assert.notEqual(at, -1, `"${id}" must be registered`);
    assert.ok(at > prev, `"${id}" must come after the previous section`);
    prev = at;
  }
});

// ---------------------------------------------------------------- S2 scroll-section.html

test('S2a: section element uses the semantic id, not section-N', () => {
  const partial = read('layouts/partials/scroll-section.html');
  assert.ok(
    partial.includes('id="{{ $id }}"'),
    'wrapper must emit id from the passed id key',
  );
  assert.ok(
    !partial.includes('id="section-'),
    'wrapper must not emit section-N ids',
  );
});

test('S2b: sections carry no copy-link/share button', () => {
  const partial = read('layouts/partials/scroll-section.html');
  assert.ok(partial.includes('id="{{ $id }}"'), 'wrapper must keep the semantic id');
  assert.ok(
    !partial.includes('copySectionLink'),
    'wrapper must not render a copy-link button',
  );
  assert.ok(
    !partial.includes('aria-label="Copy link to this section"'),
    'wrapper must not render a share button',
  );
});

// ---------------------------------------------------------------- S3 navigation JS

test('S3a: observer resolves section number by DOM index, not id parsing', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(js.includes('getSections()'), 'helper getSections() must exist');
  assert.ok(
    js.includes("Array.from(document.querySelectorAll('.scroll-snap-section'))"),
    'getSections() must collect .scroll-snap-section elements',
  );
  assert.ok(
    js.includes('getSections().indexOf(entry.target) + 1'),
    'section number must come from the element index',
  );
  assert.ok(
    !js.includes("replace('section-',"),
    'observer must not parse section-N ids',
  );
});

test('S3b: scrollToSection targets the nth scroll section by index', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(
    js.includes('this.getSections()[sectionNum - 1]'),
    'scrollToSection must index into getSections()',
  );
  assert.ok(
    !js.includes("getElementById('section-'"),
    'no section-N id lookups remain',
  );
});

test('S3c: current section syncs the URL hash via replaceState', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(js.includes('updateHash('), 'observer must call updateHash');
  assert.ok(
    js.includes("history.replaceState(null, '', '#' + id)"),
    'updateHash must use replaceState to avoid scroll jumps/history spam',
  );
});

test('S3d: deep link on load jumps instantly to the requested section', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(js.includes('location.hash'), 'init must read location.hash');
  assert.ok(
    js.includes("behavior: 'auto'"),
    'deep-link scroll must be instant (no smooth lag)',
  );
});

test('S3e: copySectionLink is removed with the share button', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(!js.includes('copySectionLink'), 'share helper must be removed');
  assert.ok(!js.includes('navigator.clipboard'), 'no clipboard usage remains');
});

// ---------------------------------------------------------------- S4 rendered output

let publicHtml = '';

before(async () => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe' });
  publicHtml = read('public/index.html');
});

test('S4a: rendered homepage has semantic section ids, no section-N', () => {
  for (const [num, [, id]] of Object.entries(SECTION_IDS)) {
    assert.ok(
      publicHtml.includes(`<section id="${id}"`) || publicHtml.includes(`<section id=${id} `),
      `rendered page must contain <section id="${id}">`,
    );
  }
  assert.ok(
    !publicHtml.includes('id="section-') && !publicHtml.includes('id=section-'),
    'no section-N ids anywhere on the homepage',
  );
});

test('S4b: rendered page has no copy-link buttons', () => {
  assert.ok(!publicHtml.includes('copySectionLink'), 'no copy buttons may be rendered');
});

test('S4c: chevron visibility expressions render for hero and section 2', () => {
  assert.ok(
    publicHtml.includes('x-show="currentSection === 1"'),
    'down chevron must show only on the hero',
  );
  assert.ok(
    publicHtml.includes('x-show="currentSection === 2"'),
    'up chevron must show only on section 2',
  );
});