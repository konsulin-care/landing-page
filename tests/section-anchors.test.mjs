// Shareable section anchors. Tests map 1:1 to the plan:
//   S1  layouts/index.html: 9 sections carry semantic ids (hero..join)
//   S2  layouts/partials/scroll-section.html: id="{{ $id }}", copy-link
//       button with Alpine feedback (no section-N ids)
//   S3  assets/js/scroll-navigation.js: decoupled lookups, hash sync via
//       replaceState, deep-link handling on load, copySectionLink()
//   S4  built HTML: <section id="hero">..<section id="join">, copy buttons
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

test('S2b: copy-link button lives inside every scroll section', () => {
  const partial = read('layouts/partials/scroll-section.html');
  assert.ok(partial.includes("copySectionLink('{{ $id }}')"), 'button must call copySectionLink with the section id');
  assert.ok(
    partial.includes('aria-label="Copy link to this section"'),
    'button must carry a descriptive aria-label',
  );
  assert.ok(
    partial.includes('absolute bottom-4 right-4'),
    'button must sit unobtrusively in the bottom-right corner',
  );
  assert.ok(
    partial.includes('x-show="copied === \'{{ $id }}\'"'),
    'button must show the copied state bound to this section id',
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

test('S3e: copySectionLink builds a shareable URL and shows feedback', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(js.includes('copySectionLink(id)'), 'copySectionLink must exist');
  assert.ok(
    js.includes("location.origin + location.pathname + '#' + id"),
    'copied url must be origin + path + #id',
  );
  assert.ok(
    js.includes('navigator.clipboard.writeText'),
    'copy must use the clipboard API',
  );
  assert.ok(
    js.includes('this.copied = id'),
    'copied state must be set to the section id for feedback',
  );
  assert.ok(
    js.includes('setTimeout'),
    'feedback must clear after a delay',
  );
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

test('S4b: every rendered section shows a copy-link button', () => {
  const buttons = publicHtml.match(/copySectionLink\('/g) ?? [];
  assert.equal(buttons.length, 9, 'exactly one copy button per section');
});

test('S4c: section CTAs still call the correct section numbers', () => {
  assert.ok(
    publicHtml.includes('copySectionLink(\'hero\')') &&
      publicHtml.includes('copySectionLink(\'join\')'),
    'copy buttons survive rendering with their section ids',
  );
});