// Home becomes a normal scrolling reading page.
//   H1  index.html drops the scroll-snap container and the ArrowDown script
//   H2  scroll-section.html has no slide logic and every section is home-section
//   H3  main.css keeps no scroll-snap or hero slide/animation rules
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

/** Parses the section dicts registered in layouts/index.html. */
function parseSections() {
  return read('layouts/index.html')
    .split('\n')
    .filter((line) => /\(dict\s+"num"/.test(line))
    .map((line) => ({
      id: line.match(/"id"\s+"([^"]+)"/)?.[1],
    }));
}

let html = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'home-scroll-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
});

test('H1: index.html has no scroll-snap container or ArrowDown script', () => {
  const index = read('layouts/index.html');
  assert.ok(!index.includes('scroll-snap-container'), 'no scroll-snap-container class');
  assert.ok(!index.includes('ArrowDown'), 'no ArrowDown handling');
  assert.ok(!index.includes('keydown'), 'no keydown script');
  assert.ok(!index.includes('scrollIntoView'), 'no scrollIntoView jump');
});

test('H2: no slide logic and every homepage section renders home-section', () => {
  const partial = read('layouts/partials/scroll-section.html');
  assert.ok(!partial.includes('scroll-snap'), 'no scroll-snap classes');
  assert.ok(!partial.includes('--slide'), 'no --slide modifier');
  assert.ok(!partial.includes('$slide'), 'no slide logic');

  const sections = parseSections();
  assert.ok(sections.length > 0, 'index.html must register sections');
  for (const section of sections) {
    const re = new RegExp(`<section\\s+[^>]*id="?${section.id}"?[^>]*class="[^"]*home-section`);
    assert.ok(re.test(html), `section ${section.id} must render with class home-section`);
  }
  const matches = html.match(/\bhome-section\b/g) ?? [];
  assert.equal(matches.length, sections.length, 'one home-section per registered section');
});

test('H3: main.css keeps no scroll-snap or hero slide rules', () => {
  const css = read('assets/css/main.css');
  for (const needle of [
    'scroll-snap-type',
    'scroll-snap-align',
    '.scroll-snap-section',
    '.hero-text',
    '.hero-image',
  ]) {
    assert.ok(!css.includes(needle), `main.css must not contain ${needle}`);
  }
});
