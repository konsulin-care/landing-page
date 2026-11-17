// 8/4 rail: on desktop the heading column (kicker, H2) takes 4 of 12 columns
// and the content takes 8; below md everything stacks.
// Expectations are derived from the section dicts registered in layouts/index.html.
//   RL1  source: registered rail partials use md:grid-cols-12 with 4/8 spans
//   RL2  source: they read page.Store "sectionNum" through section-kicker.html
//   RL3  rendered: the numbered kicker precedes the section H2
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

const HERO_PARTIAL = 'home-hero.html';
const FINAL_CTA_PARTIAL = 'home-final-cta.html';

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

/** Returns the hugo.yaml home section keys mapped to their kicker labels. */
function parseHomeKickers() {
  const out = {};
  let inHome = false;
  let current = null;
  for (const line of read('hugo.yaml').split('\n')) {
    if (/^  home:\s*$/.test(line)) {
      inHome = true;
      current = null;
      continue;
    }
    if (!inHome) continue;
    if (/^  #/.test(line) || /^\s*$/.test(line)) continue;
    if (/^  \S/.test(line) && !/^    /.test(line)) break;
    const keyMatch = line.match(/^    ([a-z0-9_]+):\s*$/);
    if (keyMatch) {
      current = keyMatch[1];
      out[current] = out[current] ?? {};
      continue;
    }
    const kickerMatch = line.match(/^      kicker:\s*"?(.*?)"?\s*$/);
    if (kickerMatch && current) out[current].kicker = kickerMatch[1];
  }
  return out;
}

/** Derives the hugo.yaml home key for a partial, honouring an explicit key. */
function sectionKey(section) {
  if (section.key) return section.key;
  return section.partial
    .replace(/^home-/, '')
    .replace(/\.html$/, '')
    .replace(/-/g, '_');
}

/** Returns the markup of one rendered homepage section. */
function sectionHtml(id) {
  const start = html.search(new RegExp(`<section\\s+[^>]*id="?${id}"?`));
  assert.ok(start >= 0, `rendered <section id="${id}"> exists`);
  return html.slice(start, html.indexOf('</section>', start));
}

let html = '';
let railSections = [];
let kickers = {};

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-rail-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
  railSections = parseSections().filter(
    (s) => s.partial !== HERO_PARTIAL && s.partial !== FINAL_CTA_PARTIAL,
  );
  kickers = parseHomeKickers();
});

// ── RL1 source ─────────────────────────────────────────────────────
test('RL1a: rail partials use md:grid-cols-12 with a 4-column heading and 8-column content', () => {
  for (const section of railSections) {
    const partial = read(`layouts/partials/${section.partial}`);
    assert.ok(partial.includes('md:grid-cols-12'), `${section.partial} must use md:grid-cols-12`);
    assert.ok(partial.includes('md:col-span-4'), `${section.partial} needs md:col-span-4`);
    assert.ok(partial.includes('md:col-span-8'), `${section.partial} needs md:col-span-8`);
  }
});

test('RL1b: grid-cols-12 and col-span-* never appear without the md: prefix', () => {
  for (const section of railSections) {
    const partial = read(`layouts/partials/${section.partial}`);
    assert.ok(!/(?<![\w:-])grid-cols-12/.test(partial), `${section.partial}: bare grid-cols-12`);
    assert.ok(!/(?<![\w:-])col-span-(4|8)/.test(partial), `${section.partial}: bare col-span-4/8`);
  }
});

// ── RL2 source ─────────────────────────────────────────────────────
test('RL2a: rail partials render the kicker through section-kicker.html with the section number', () => {
  for (const section of railSections) {
    const partial = read(`layouts/partials/${section.partial}`);
    assert.match(partial, /partial\s+"section-kicker\.html"/, `${section.partial} calls section-kicker.html`);
    assert.match(partial, /page\.Store\.Get\s+"sectionNum"/, `${section.partial} reads the section number`);
  }
});

// ── RL3 rendered ───────────────────────────────────────────────────
test('RL3a: the numbered kicker precedes the H2 in each rail section', () => {
  for (const section of railSections) {
    const key = sectionKey(section);
    const label = kickers[key]?.kicker;
    assert.ok(label, `hugo.yaml params.home.${key}.kicker must exist`);
    const expected = `${String(section.num - 1).padStart(2, '0')} · ${label}`;
    const markup = sectionHtml(section.id);
    const position = markup.indexOf(expected);
    assert.ok(position >= 0, `${section.id} renders "${expected}"`);
    assert.ok(position < markup.indexOf('<h2'), `${section.id} kicker must come before the H2`);
  }
});
