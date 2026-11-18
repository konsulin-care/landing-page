// Meaning section (HS2): #JadiTangguh is not "strong all the time".
//   M1  the section follows #kenali-tandanya, carries band-surface, and shows
//       kicker "02 · Makna tangguh" before the H2 and the lead
//   M2  three bg-card cards in order, muted line and emphasised line
//   M3  md:grid-cols-3 card list inside the 12-column rail
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

/** Returns the rendered section markup for the given DOM id. */
function sectionHtml(html, id) {
  const start = html.search(new RegExp(`<section\\s+[^>]*id="?${id}"?`));
  assert.ok(start >= 0, `rendered <section id="${id}"> exists`);
  return html.slice(start, html.indexOf('</section>', start));
}

/** Returns the rendered card blocks, one per meaning card. */
function cards() {
  return [...section.matchAll(/<li class="rounded-lg border border-border bg-card p-6">[\s\S]*?<\/li>/g)].map(
    (m) => m[0],
  );
}

let html = '';
let section = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'home-meaning-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
  section = sectionHtml(html, 'makna-tangguh');
});

// ── M1 position, band tone, kicker, heading, lead ──────────────────
test('M1a: #makna-tangguh follows #kenali-tandanya', () => {
  const recognition = html.search(/<section\s+[^>]*id="?kenali-tandanya"?/);
  const meaning = html.search(/<section\s+[^>]*id="?makna-tangguh"?/);
  assert.ok(recognition >= 0, '#kenali-tandanya is rendered');
  assert.ok(meaning >= 0, '#makna-tangguh is rendered');
  assert.ok(recognition < meaning, '#makna-tangguh follows #kenali-tandanya');
});

test('M1b: the section carries the band-surface tone', () => {
  const opening = section.slice(0, section.indexOf('>') + 1);
  assert.match(opening, /band-surface/);
});

test('M1c: the kicker renders before the H2 and the lead follows it', () => {
  const kicker = section.indexOf('02 · Makna tangguh');
  const heading = section.search(/<h2[^>]*>\s*Tangguh bukan berarti kuat terus\s*<\/h2>/);
  const lead = section.search(
    /<p class="mt-6 text-base leading-7 text-charcoal-700 md:text-lg md:leading-8">/,
  );
  assert.ok(kicker >= 0, 'kicker "02 · Makna tangguh" is rendered');
  assert.ok(heading >= 0, 'H2 is rendered');
  assert.ok(lead >= 0, 'lead paragraph is rendered');
  assert.ok(kicker < heading, 'kicker precedes the H2');
  assert.ok(heading < lead, 'lead follows the H2');
});

// ── M2 cards ───────────────────────────────────────────────────────
test('M2a: three bg-card cards render the muted line in muted-foreground', () => {
  const blocks = cards();
  assert.equal(blocks.length, 3, 'three bg-card cards are rendered');
  for (const block of blocks) {
    assert.match(
      block,
      /<p class="text-sm leading-6 text-muted-foreground">[^<]+<\/p>/,
      'each card opens with a muted-foreground line',
    );
  }
});

test('M2b: the emphasised lines render in font-semibold text-foreground', () => {
  for (const block of cards()) {
    assert.match(
      block,
      /<p class="mt-2 text-base font-semibold text-foreground">[^<]+<\/p>/,
      'each card closes with a font-semibold text-foreground line',
    );
  }
});

test('M2c: the three cards render in order and each pairs muted then emphasises', () => {
  const blocks = cards();
  const positions = blocks.map((block) => section.indexOf(block));
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i - 1] < positions[i], `card ${i + 1} follows card ${i}`);
  }
  for (const block of blocks) {
    assert.ok(
      block.indexOf('text-muted-foreground') < block.indexOf('font-semibold text-foreground'),
      'the muted line precedes the emphasised line',
    );
  }
});

// ── M3 layout ──────────────────────────────────────────────────────
test('M3a: the card list uses md:grid-cols-3 inside the 12-column rail', () => {
  assert.match(section, /<ul class="?grid gap-4 md:grid-cols-3"?>/);
  assert.match(section, /md:grid-cols-12/);
  assert.match(section, /md:col-span-4/);
  assert.match(section, /md:col-span-8/);
});
