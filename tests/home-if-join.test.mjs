// If-join section (T7): what taking part asks of the reader.
//   IJ1  #kalau-ikut follows #kenapa-dicatat, carries band-surface, and shows
//        kicker "04 · Kalau Anda ikut" before the H2
//   IJ2  the three steps render as an ordered list with bold title then text
//   IJ3  the four assurances render in a flex-wrap list, followed by the study link
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

/** Returns the markup of the rendered section with the given DOM id. */
function sectionHtml(html, id) {
  const start = html.search(new RegExp(`<section\\s+[^>]*id="?${id}"?`));
  assert.ok(start >= 0, `rendered <section id="${id}"> exists`);
  return html.slice(start, html.indexOf('</section>', start));
}

const STEPS = [
  [
    'Isi Survei.',
    'Jawab pertanyaan tentang apa yang sehari-hari Anda rasakan. Tidak ada jawaban benar atau salah.',
  ],
  [
    'Dapatkan ID Anonim.',
    'Begitu selesai, sistem otomatis membuat ID Anonim, sehingga partisipasi Anda tidak memakai nama Anda.',
  ],
  [
    'Lihat Laporan Anda.',
    'Laporan ringkas langsung tersedia. Email hanya diperlukan jika Anda ingin menyimpannya.',
  ],
];

const ASSURANCES = ['Gratis', 'Boleh berhenti kapan saja', 'Data tidak dijual', 'Bukan diagnosis'];

let html = '';
let section = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'home-if-join-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
  section = sectionHtml(html, 'kalau-ikut');
});

// ── IJ1 order, band, kicker, heading ───────────────────────────────
test('IJ1a: the section follows #kenapa-dicatat and carries band-surface', () => {
  const why = html.search(/<section\s+[^>]*id="?kenapa-dicatat"?/);
  const join = html.search(/<section\s+[^>]*id="?kalau-ikut"?/);
  assert.ok(why >= 0, 'rendered <section id="kenapa-dicatat"> exists');
  assert.ok(join >= 0, 'rendered <section id="kalau-ikut"> exists');
  assert.ok(why < join, '#kalau-ikut follows #kenapa-dicatat');
  assert.match(section, /class="[^"]*\bband-surface\b[^"]*"/);
});

test('IJ1b: the kicker "04 · Kalau Anda ikut" precedes the H2', () => {
  const kicker = section.indexOf('04 · Kalau Anda ikut');
  const heading = section.indexOf('Sepuluh menit, tanpa nama');
  assert.ok(kicker >= 0, 'kicker "04 · Kalau Anda ikut" is rendered');
  assert.ok(heading >= 0, 'H2 is rendered');
  assert.ok(kicker < heading, 'kicker precedes the H2');
  assert.match(section, /<h2[^>]*>\s*Sepuluh menit, tanpa nama\s*<\/h2>/);
});

// ── IJ2 steps ──────────────────────────────────────────────────────
test('IJ2a: the three steps render in order inside an ordered list', () => {
  assert.match(section, /<ol class="?grid gap-4"?>/);
  const positions = STEPS.map(([title]) => {
    const at = section.indexOf(title);
    assert.ok(at >= 0, `step ${title} is rendered`);
    return at;
  });
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i - 1] < positions[i], `step ${STEPS[i][0]} follows ${STEPS[i - 1][0]}`);
  }
});

test('IJ2b: each step renders a bold title followed by its text', () => {
  for (const [title, text] of STEPS) {
    const pattern = new RegExp(
      `<strong class="?font-semibold text-foreground"?>${title.replace('.', '\\.')}</strong>\\s*${text.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      )}`,
    );
    assert.match(section, pattern, `${title} is followed by its text`);
  }
});

test('IJ2c: each step card shows its number and the card classes', () => {
  assert.match(section, /<li class="?flex gap-4 rounded-lg border border-border bg-card p-6"?>/);
  assert.match(section, /<span class="?text-2xl font-bold text-turquoise-deep"?>1<\/span>/);
  assert.match(section, /<span class="?text-2xl font-bold text-turquoise-deep"?>2<\/span>/);
  assert.match(section, /<span class="?text-2xl font-bold text-turquoise-deep"?>3<\/span>/);
});

// ── IJ3 assurances and link ────────────────────────────────────────
test('IJ3a: the four assurances render in order inside a flex-wrap list', () => {
  assert.match(section, /<ul class="?mt-8 flex flex-wrap gap-2"?>/);
  const positions = ASSURANCES.map((label) => {
    const at = section.indexOf(`>${label}<`);
    assert.ok(at >= 0, `assurance ${label} is rendered`);
    return at;
  });
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(
      positions[i - 1] < positions[i],
      `assurance ${ASSURANCES[i]} follows ${ASSURANCES[i - 1]}`,
    );
  }
  assert.match(
    section,
    /<li class="?rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"?>/,
  );
});

test('IJ3b: the study link points to /research/jadi-tangguh/ with the link classes', () => {
  assert.match(section, /href="?(https:\/\/konsulin\.care)?\/research\/jadi-tangguh\/"?[ >]/);
  assert.match(
    section,
    /<a href="?(https:\/\/konsulin\.care)?\/research\/jadi-tangguh\/"? class="?text-sm font-semibold text-turquoise-deep underline underline-offset-4"?>/,
  );
  assert.ok(section.includes('Baca detail studi dan janji kami'), section);
});
