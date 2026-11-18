// Recognition section (HS1): the homepage names everyday signs of strain.
//   R1  kicker "01 · Kenali tandanya" precedes the H2 and the lead
//   R2  six signals in order, with markdown emphasis rendered as <em>
//   R3  non-diagnosis note, the #JadiTangguh closing line, and the help link
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

/** Returns the markup of the rendered #kenali-tandanya section. */
function sectionHtml(html, id) {
  const start = html.search(new RegExp(`<section\\s+[^>]*id="?${id}"?`));
  assert.ok(start >= 0, `rendered <section id="${id}"> exists`);
  return html.slice(start, html.indexOf('</section>', start));
}

let html = '';
let section = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'home-recognition-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
  section = sectionHtml(html, 'kenali-tandanya');
});

// ── R1 kicker, heading, lead ───────────────────────────────────────
test('R1a: the section renders the numbered kicker before the H2', () => {
  const position = section.indexOf('01 · Kenali tandanya');
  assert.ok(position >= 0, 'kicker "01 · Kenali tandanya" is rendered');
  assert.ok(position < section.indexOf('Stres jarang datang dengan nama'), 'kicker precedes the H2');
  assert.match(section, /<h2[^>]*>\s*Stres jarang datang dengan nama\s*<\/h2>/);
});

// ── R2 signals ─────────────────────────────────────────────────────
test('R2a: the six signals render in order', () => {
  const labels = ['Tubuh', 'Tidur', 'Pikiran', 'Uang', 'Hubungan', 'Diam'];
  const positions = labels.map((label) => {
    const at = section.indexOf(`>${label}<`);
    assert.ok(at >= 0, `signal ${label} is rendered`);
    return at;
  });
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(positions[i - 1] < positions[i], `signal ${labels[i]} follows ${labels[i - 1]}`);
  }
});

test('R2b: signal text renders with <em> for markdown emphasis', () => {
  assert.match(section, /Perut mulas setiap menjelang <em>deadline<\/em>\./);
  assert.match(section, /Banyak <em>pikiran<\/em>, bahkan saat mau istirahat\./);
});

// ── R3 note, closing, help link ────────────────────────────────────
test('R3a: the non-diagnosis note is rendered', () => {
  assert.match(
    section,
    /<p class="?mt-8 text-sm leading-6 text-muted-foreground"?>\s*Ini bukan daftar untuk mendiagnosis/,
    'the note paragraph states that the list is not for self-diagnosis',
  );
});

test('R3b: the closing paragraph renders the #JadiTangguh anchor', () => {
  const anchor = section.match(
    /<p class="?mt-4 text-base font-medium text-foreground md:text-lg"?>[\s\S]*?<\/p>/,
  );
  assert.ok(anchor, 'the closing paragraph is rendered');
  assert.match(anchor[0], /<a\b[^>]*>#JadiTangguh<\/a>/, 'the closing paragraph links #JadiTangguh');
});

test('R3d: #JadiTangguh links to the hashtag URL in the closing line', () => {
  const closing = section.match(
    /<p class="?mt-4 text-base font-medium text-foreground md:text-lg"?>[\s\S]*?<\/p>/,
  );
  assert.ok(closing, 'the closing paragraph is rendered');
  const anchor = closing[0].match(/<a\b[^>]*>#JadiTangguh<\/a>/);
  assert.ok(anchor, 'the closing #JadiTangguh is an anchor');
  assert.match(
    anchor[0],
    /href="?(https:\/\/konsulin\.care)?\/?[^"\s>]*instagram[^"\s>]*"?/,
  );
  assert.match(anchor[0], /target="?_blank"?/);
  assert.match(anchor[0], /rel="?noopener"?/);
});

test('R3c: the help link points to /faq/#bantuan', () => {
  assert.match(section, /href="?(https:\/\/konsulin\.care)?\/faq\/#bantuan"?[ >]/);
});
