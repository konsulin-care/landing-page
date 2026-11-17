// 8/4 rail: on desktop the heading column (kicker, H2) takes 4 of 12 columns
// and the content takes 8; below md everything stacks.
//   RL1  source: partials use md:grid-cols-12 with md:col-span-4 and md:col-span-8
//   RL2  rendered: the numbered kicker comes before the section H2
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// partial -> [section id, expected rendered kicker]
const RAIL = {
  'home-how-it-works': ['how-it-works', '02 · Tiga langkah'],
  'home-research-credibility': ['research-credibility', '04 · Di balik survei'],
};

let html;

/** Returns the rendered markup of one homepage <section>. */
function sectionHtml(id) {
  const start = html.search(new RegExp(`<section\\s+id="?${id}"?`));
  assert.ok(start >= 0, `rendered <section id="${id}"> exists`);
  return html.slice(start, html.indexOf('</section>', start));
}

before(() => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe', timeout: 60000 });
  html = read('public/index.html');
});

// ── RL1 source ─────────────────────────────────────────────────────
test('RL1a: rail partials use md:grid-cols-12 with a 4-column heading and 8-column content', () => {
  for (const name of Object.keys(RAIL)) {
    const partial = read(`layouts/partials/${name}.html`);
    assert.ok(partial.includes('md:grid-cols-12'), `${name} must use md:grid-cols-12`);
    assert.ok(partial.includes('md:col-span-4'), `${name} must have a md:col-span-4 heading column`);
    assert.ok(partial.includes('md:col-span-8'), `${name} must have a md:col-span-8 content column`);
  }
});

test('RL1b: grid-cols-12 and col-span-* never appear without the md: prefix', () => {
  for (const name of Object.keys(RAIL)) {
    const partial = read(`layouts/partials/${name}.html`);
    assert.ok(!/(?<![\w:-])grid-cols-12/.test(partial), `${name}: bare grid-cols-12`);
    assert.ok(!/(?<![\w:-])col-span-(4|8)/.test(partial), `${name}: bare col-span-4/8`);
  }
});

test('RL1c: rail partials render the kicker through section-kicker.html with the section number', () => {
  for (const name of Object.keys(RAIL)) {
    const partial = read(`layouts/partials/${name}.html`);
    assert.match(partial, /partial\s+"section-kicker\.html"/, `${name} calls section-kicker.html`);
    assert.match(partial, /page\.Store\.Get\s+"sectionNum"/, `${name} reads the section number`);
  }
});

// ── RL2 rendered ───────────────────────────────────────────────────
test('RL2a: rendered kicker precedes the H2 in each rail section', () => {
  for (const [, [id, kicker]] of Object.entries(RAIL)) {
    const section = sectionHtml(id);
    const k = section.indexOf(kicker);
    assert.ok(k >= 0, `${id} renders "${kicker}"`);
    assert.ok(k < section.indexOf('<h2'), `${id} kicker must come before the H2`);
  }
});
