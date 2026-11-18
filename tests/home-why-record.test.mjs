// Why record section (T6): the homepage explains why repeated participation matters.
//   W1  #kenapa-dicatat follows #makna-tangguh, carries band-paper, and shows the
//       numbered kicker before the H2, followed by the intro paragraph
//   W2  the supporting line renders inside a blockquote card
//   W3  the closing line renders after the quote in the recognition closing style
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

let html = '';
let section = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'home-why-record-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
  section = sectionHtml(html, 'kenapa-dicatat');
});

// ── W1 order, band, kicker, heading, lead ──────────────────────────
test('W1a: the section follows #makna-tangguh and carries band-paper', () => {
  const meaning = html.search(/<section\s+[^>]*id="?makna-tangguh"?/);
  const why = html.search(/<section\s+[^>]*id="?kenapa-dicatat"?/);
  assert.ok(meaning >= 0, 'rendered <section id="makna-tangguh"> exists');
  assert.ok(why >= 0, 'rendered <section id="kenapa-dicatat"> exists');
  assert.ok(meaning < why, '#kenapa-dicatat follows #makna-tangguh');
  assert.match(section, /class="[^"]*\bband-paper\b[^"]*"/);
});

test('W1b: the kicker precedes the H2, which is followed by the intro paragraph', () => {
  const kicker = section.indexOf('03 · Kenapa dicatat');
  const heading = section.indexOf('Yang nggak dicatat, nggak terlihat');
  const lead = section.indexOf(
    'Kebijakan yang baik butuh data yang baik. Untuk menjawab masalah yang benar-benar kita alami, peneliti perlu mendengarnya langsung dari kita.',
  );
  assert.ok(kicker >= 0, 'kicker "03 · Kenapa dicatat" is rendered');
  assert.ok(heading >= 0, 'H2 is rendered');
  assert.ok(lead >= 0, 'intro paragraph is rendered');
  assert.ok(kicker < heading, 'kicker precedes the H2');
  assert.match(section, /<h2[^>]*>\s*Yang nggak dicatat, nggak terlihat\s*<\/h2>/);
  assert.ok(heading < lead, 'intro paragraph follows the H2');
});

// ── W2 blockquote ──────────────────────────────────────────────────
test('W2a: the supporting line renders inside a blockquote card', () => {
  assert.match(
    section,
    /<blockquote class="rounded-lg border border-border bg-card p-6 text-lg leading-8 text-foreground md:text-xl">/,
  );
  assert.ok(
    section.includes(
      'Satu kali pengisian ibarat satu foto. Pengisian berulang membantu kita melihat ceritanya secara utuh.',
    ),
    section,
  );
});

// ── W3 closing ─────────────────────────────────────────────────────
test('W3a: the closing line renders after the quote with the closing style', () => {
  const quote = section.indexOf(
    'Satu kali pengisian ibarat satu foto. Pengisian berulang membantu kita melihat ceritanya secara utuh.',
  );
  const closing = section.indexOf(
    'Ini riset warga: dikumpulkan oleh publik, kembali untuk publik.',
  );
  assert.ok(closing >= 0, 'closing line is rendered');
  assert.ok(quote < closing, 'closing follows the quote');
  assert.match(
    section,
    /<p class="mt-8 text-base font-medium text-foreground md:text-lg">[^<]*Ini riset warga: dikumpulkan oleh publik, kembali untuk publik\./,
  );
});
