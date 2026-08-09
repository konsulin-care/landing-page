// 8-section homepage architecture. Tests map 1:1 to the plan:
//   S1  layouts/index.html registers exactly 8 sections in order
//       (hero, citizen-science, privacy, transparency, process,
//       collaboration, impact, join)
//   S2  JS scroll-snap machinery is gone: no scrollNavigation bindings,
//       no scroll-indicator partial, no carousel assets, and the
//       scroll-navigation/hero-rotator/vision-carousel/scroll-indicator/
//       carousel files are deleted
//   S3  layouts/partials/scroll-section.html keeps semantic ids
//   S4  built HTML: 8 sections, chevrons are plain anchors (#citizen-science
//       on the hero, #hero on section 2), no currentSection expressions
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
  2: ['home-citizen-science', 'citizen-science'],
  3: ['home-privacy', 'privacy'],
  4: ['home-transparency', 'transparency'],
  5: ['home-process', 'process'],
  6: ['home-collaboration', 'collaboration'],
  7: ['home-impact', 'impact'],
  8: ['home-cta', 'join'],
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

test('S1c: index.html registers exactly 8 section partials', () => {
  const index = read('layouts/index.html');
  const count = (index.match(/"partial" "home-[a-z-]+\.html"/g) ?? []).length;
  assert.equal(count, 8, 'index.html must register exactly 8 section partials');
});

// ---------------------------------------------------------------- S2 no snap machinery

test('S2a: index.html carries no scroll-snap bindings or dead assets', () => {
  const index = read('layouts/index.html');
  assert.ok(!index.includes('scrollNavigation'), 'no scrollNavigation binding');
  assert.ok(!index.includes('x-init'), 'no x-init on main');
  assert.ok(!index.includes('@keydown.window'), 'no keyboard interception');
  assert.ok(!index.includes('scroll-indicator'), 'no scroll-indicator partial call');
  assert.ok(!index.includes('carousel.css'), 'no carousel css link');
  assert.ok(!index.includes('carousel.js'), 'no carousel js script');
});

test('S2b: snap/carousel/rotator files are deleted', () => {
  for (const rel of [
    'assets/js/scroll-navigation.js',
    'assets/js/hero-rotator.js',
    'assets/js/vision-carousel.js',
    'layouts/partials/scroll-indicator.html',
    'layouts/partials/home-participation.html',
    'layouts/partials/home-problem.html',
    'static/js/carousel.js',
    'static/css/carousel.css',
  ]) {
    assert.ok(!exists(rel), `${rel} must be deleted`);
  }
});

test('S2c: footer no longer builds the removed scripts', () => {
  const footer = read('layouts/partials/footer.html');
  for (const gone of ['vision-carousel', 'scroll-navigation', 'hero-rotator']) {
    assert.ok(!footer.includes(gone), `footer must not reference ${gone}`);
  }
});

test('S2d: no dangling references to removed files anywhere in layouts', () => {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.html')) {
        const content = fs.readFileSync(p, 'utf8');
        for (const gone of [
          'scrollNavigation',
          'scroll-indicator',
          'heroRotator',
          'hero-rotator',
          'vision-carousel',
          'carousel.css',
          'carousel.js',
        ]) {
          assert.ok(!content.includes(gone), `${p} must not reference ${gone}`);
        }
      }
    }
  };
  walk(path.join(ROOT, 'layouts'));
});

// ---------------------------------------------------------------- S3 scroll-section.html

test('S3a: section element uses the semantic id, not section-N', () => {
  const partial = read('layouts/partials/scroll-section.html');
  assert.ok(
    partial.includes('id="{{ $id }}"'),
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

test('S4a: rendered homepage has 8 semantic section ids', () => {
  for (const [num, [, id]] of Object.entries(SECTION_IDS)) {
    assert.ok(
      publicHtml.includes(`<section id="${id}"`) || publicHtml.includes(`<section id=${id} `),
      `rendered page must contain <section id="${id}"> (section ${num})`,
    );
  }
});

test('S4b: rendered page has exactly 8 snap-section elements', () => {
  // Hugo minifies unquoted single-class attributes; match the class token
  // regardless of quoting, but not __content wrappers or the --slide modifier.
  const sections = (publicHtml.match(/scroll-snap-section(?=\s|["'>])/g) ?? []).length;
  assert.equal(sections, 8, 'rendered page must have exactly 8 snap sections');
});

test('S4c: chevrons are plain anchors between hero and section 2 only', () => {
  // Minified attributes may be quoted or unquoted.
  const hasHref = (frag) =>
    publicHtml.includes(`href="${frag}"`) || publicHtml.includes(`href=${frag}`);
  assert.ok(hasHref('#citizen-science'), 'hero down-chevron must anchor to #citizen-science');
  assert.ok(hasHref('#hero'), 'section 2 must carry an up-chevron anchor to #hero');
  assert.ok(
    !publicHtml.includes('x-show="currentSection'),
    'no currentSection visibility expressions may render',
  );
  assert.ok(!publicHtml.includes('scrollNavigation'), 'no scrollNavigation in output');
});
