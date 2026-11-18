// Hero copy and metadata (T4): the homepage speaks about the movement, not burnout.
//   C1  the hero body is the single movement line, and the page has no old claims
//   C2  the hero chevron targets #kenali-tandanya; no retired anchor survives and
//       every in-page href resolves to an element id
//   C3  the document title and meta description carry the new copy
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

const MOVEMENT_LINE = 'Gerakan warga untuk saling jaga.';
const RETIRED_ANCHOR = 'why-this-research-matters';

/** Strips the production canonical URL prefix from an href value. */
function normalizeHref(value) {
  return value.replace(/^https:\/\/konsulin\.care/, '');
}

/** Returns every href value found in the rendered page. */
function hrefs(html) {
  return [...html.matchAll(/href=(?:"([^"]*)"|([^\s>]+))/g)].map((match) =>
    normalizeHref(match[1] ?? match[2]),
  );
}

/** Returns the rendered home-hero section markup. */
function heroHtml(html) {
  const start = html.search(/<section\s+[^>]*id="?hero"?/);
  assert.ok(start >= 0, 'rendered <section id="hero"> exists');
  return html.slice(start, html.indexOf('</section>', start));
}

let html = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'home-hero-copy-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
});

// ── C1 hero body ───────────────────────────────────────────────────
test('C1a: the hero renders the single movement paragraph', () => {
  const hero = heroHtml(html);
  assert.ok(hero.includes(MOVEMENT_LINE), `hero must render "${MOVEMENT_LINE}"`);
  const matches = html.split(MOVEMENT_LINE).length - 1;
  assert.ok(matches >= 1, 'movement line is present');
});

test('C1b: the homepage no longer mentions ribuan or burnout', () => {
  assert.ok(!/ribuan/i.test(html), 'homepage must not contain "ribuan"');
  assert.ok(!/burnout/i.test(html), 'homepage must not contain "burnout"');
});

// ── C2 anchors ─────────────────────────────────────────────────────
test('C2a: the hero chevron links to #kenali-tandanya', () => {
  const hero = heroHtml(html);
  const chevron = hero.match(/<a\b[^>]*aria-label=(?:"Lanjut ke bagian berikutnya"|Lanjut[^>]*)>/);
  assert.ok(chevron, 'hero renders the down chevron anchor');
  assert.match(
    chevron[0],
    /href=(?:"(?:https:\/\/konsulin\.care)?#kenali-tandanya"|(?:https:\/\/konsulin\.care)?#kenali-tandanya[\s>])/,
  );
});

test('C2b: no homepage link targets the retired anchor', () => {
  assert.ok(!html.includes(RETIRED_ANCHOR), `homepage must not reference ${RETIRED_ANCHOR}`);
  assert.ok(!read('layouts/partials/home-hero.html').includes(RETIRED_ANCHOR));
});

test('C2c: every in-page href resolves to an element id', () => {
  const ids = new Set([...html.matchAll(/\bid=(?:"([^"]*)"|([^\s>]+))/g)].map((m) => m[1] ?? m[2]));
  for (const href of hrefs(html)) {
    const hash = href.indexOf('#');
    if (hash < 0) continue;
    const inPage = href.slice(0, hash) === '' || href.slice(0, hash) === '/';
    if (!inPage) continue;
    const target = decodeURIComponent(href.slice(hash + 1));
    assert.ok(ids.has(target), `in-page href "${href}" must resolve to an element id`);
  }
});

// ── C3 metadata ────────────────────────────────────────────────────
test('C3a: the title trims to the new meta title', () => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  assert.ok(match, 'homepage renders a title element');
  assert.equal(match[1].trim(), 'Konsulin | Bareng Warga, Saling Jaga');
});

test('C3b: the meta description is the movement line', () => {
  const match = html.match(
    /<meta\s+name="?description"?\s+content=(?:"([^"]*)"|([^\s>]+))/,
  );
  assert.ok(match, 'homepage renders a meta description');
  assert.equal((match[1] ?? match[2]).trim(), MOVEMENT_LINE);
});
