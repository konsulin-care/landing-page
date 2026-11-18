// Homepage section registry, derived from layouts/index.html.
//   S1  index.html registers only the hero, recognition and final-cta sections
//   S2  the retired study sections are gone from the rendered homepage
//   S3  scroll-section.html still emits semantic ids
//   S4  every registered section renders, with unique ids and ascending nums
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

const RETIRED_IDS = [
  'why-this-research-matters',
  'how-it-works',
  'claim-report',
  'research-credibility',
];

/** Parses the section dicts registered in layouts/index.html. */
function parseSections() {
  const index = read('layouts/index.html');
  return index
    .split('\n')
    .filter((line) => /\(dict\s+"num"/.test(line))
    .map((line) => ({
      num: Number(line.match(/"num"\s+(\d+)/)?.[1]),
      tone: line.match(/"tone"\s+"([^"]+)"/)?.[1],
      id: line.match(/"id"\s+"([^"]+)"/)?.[1],
      partial: line.match(/"partial"\s+"([^"]+)"/)?.[1],
      key: line.match(/"key"\s+"([^"]+)"/)?.[1],
    }));
}

let html = '';
let dest = '';

before(() => {
  dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'section-anchors-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
});

// ── S1 source ──────────────────────────────────────────────────────
test('S1a: index.html registers only hero, recognition and final-cta', () => {
  const sections = parseSections();
  assert.equal(sections.length, 3, 'index.html must define exactly 3 sections');
  assert.deepEqual(
    sections.map((s) => s.id),
    ['hero', 'kenali-tandanya', 'final-cta'],
  );
  assert.deepEqual(
    sections.map((s) => s.partial),
    ['home-hero.html', 'home-recognition.html', 'home-final-cta.html'],
  );
});

test('S1b: hero uses paper and final-cta uses charcoal', () => {
  const sections = parseSections();
  assert.equal(sections.find((s) => s.id === 'hero')?.tone, 'paper');
  assert.equal(sections.find((s) => s.id === 'final-cta')?.tone, 'charcoal');
});

// ── S2 retired sections are gone ───────────────────────────────────
test('S2a: index.html no longer registers the retired study sections', () => {
  const index = read('layouts/index.html');
  for (const id of RETIRED_IDS) {
    assert.ok(!index.includes(`"id" "${id}"`), `index.html must not register ${id}`);
  }
});

test('S2b: rendered homepage contains none of the retired ids', () => {
  for (const id of RETIRED_IDS) {
    assert.ok(!html.includes(`id="${id}"`), `rendered page must not contain id="${id}"`);
  }
});

// ── S3 semantic ids ────────────────────────────────────────────────
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

// ── S4 rendered output ─────────────────────────────────────────────
test('S4a: each registered section renders as a semantic <section id>', () => {
  const sections = parseSections();
  for (const section of sections) {
    const re = new RegExp(`<section\\s+[^>]*id="?${section.id}"?[^>]*>`);
    assert.ok(re.test(html), `rendered page must contain <section id="${section.id}">`);
  }
});

test('S4b: section ids are unique and section nums ascend', () => {
  const sections = parseSections();
  const ids = sections.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'section ids must be unique');
  const nums = sections.map((s) => s.num);
  const sorted = [...nums].sort((a, b) => a - b);
  assert.deepEqual(nums, sorted, 'section nums must ascend');
});

test('S4c: no scroll-snap navigation JS renders', () => {
  assert.ok(!html.includes('scrollNavigation'), 'no scrollNavigation in output');
  assert.ok(!html.includes('x-show="currentSection'), 'no currentSection expressions');
});

test('S4d: every registered section renders with class home-section', () => {
  const sections = parseSections();
  const matches = html.match(/\bhome-section\b/g) ?? [];
  assert.equal(
    matches.length,
    sections.length,
    'rendered home-section count must equal registered section count',
  );
});

test('S4e: no scroll-snap remnants in source or rendered output', () => {
  for (const rel of ['layouts/index.html', 'layouts/partials/scroll-section.html']) {
    assert.ok(!read(rel).includes('scroll-snap'), `${rel} must not contain scroll-snap`);
  }
  assert.ok(!html.includes('scroll-snap'), 'rendered homepage must not contain scroll-snap');
});
