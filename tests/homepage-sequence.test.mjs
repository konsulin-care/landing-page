// Homepage sequence (T7): the six sections read as one ordered narrative.
//   S1  the rendered homepage contains exactly the six section ids in order
//   S2  numbered kickers 01, 02, 03, 04 render in ascending order
//   S3  #kalau-ikut carries band-surface
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

const SECTION_IDS = [
  'hero',
  'kenali-tandanya',
  'makna-tangguh',
  'kenapa-dicatat',
  'kalau-ikut',
  'final-cta',
];

let html = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-sequence-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
});

/** Returns the DOM ids of the rendered homepage sections, in document order. */
function renderedSectionIds() {
  const ids = [];
  const re = /<section\s+[^>]*id="?([a-z0-9-]+)"?/g;
  let match = re.exec(html);
  while (match !== null) {
    ids.push(match[1]);
    match = re.exec(html);
  }
  return ids;
}

// ── S1 section order ───────────────────────────────────────────────
test('S1a: the six section ids render once each in the intended order', () => {
  assert.deepEqual(renderedSectionIds(), SECTION_IDS);
});

// ── S2 kicker order ────────────────────────────────────────────────
test('S2a: numbered kickers 01 through 04 render in ascending order', () => {
  const kickers = [
    '01 · Kenali tandanya',
    '02 · Makna tangguh',
    '03 · Kenapa dicatat',
    '04 · Kalau Anda ikut',
  ];
  const positions = kickers.map((kicker) => {
    const at = html.indexOf(kicker);
    assert.ok(at >= 0, `kicker "${kicker}" is rendered`);
    return at;
  });
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i - 1] < positions[i], `${kickers[i]} follows ${kickers[i - 1]}`);
  }
});

// ── S3 band ────────────────────────────────────────────────────────
test('S3a: #kalau-ikut carries band-surface between paper bands', () => {
  const match = html.match(/<section\s+[^>]*id="?kalau-ikut"?[^>]*?class="?([^">]*)/);
  assert.ok(match, 'rendered <section id="kalau-ikut"> has a class attribute');
  const classes = match[1].split(/\s+/);
  assert.ok(classes.includes('band-surface'), '#kalau-ikut carries band-surface');
  assert.ok(classes.includes('border-y'), '#kalau-ikut carries border-y');
  assert.ok(classes.includes('border-border'), '#kalau-ikut carries border-border');
});
