// Hero copy and metadata (T4): the homepage speaks about the movement, not burnout.
//   C1  the hero body is a single paragraph after the h1
//   C2  the hero chevron targets #kenali-tandanya and every in-page href resolves
//   C3  the document title and meta description carry the configured copy
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

/** Returns the configured value of a top-level `key:` under params. */
function configValue(key) {
  const m = read('hugo.yaml').match(new RegExp(`^\\s{2}${key}:\\s*["']?(.*?)["']?\\s*$`, 'm'));
  assert.ok(m, `params.${key} is configured`);
  return m[1].trim();
}

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
test('C1a: the hero renders exactly one body paragraph after the h1', () => {
  const hero = heroHtml(html);
  const bodyParas = [...hero.matchAll(/<p\b[^>]*text-charcoal-700[^>]*>/g)];
  assert.equal(bodyParas.length, 1, 'hero renders a single body paragraph');
  const h1End = hero.indexOf('</h1>');
  assert.ok(h1End >= 0, 'hero renders a closing h1 tag');
  assert.ok(hero.indexOf(bodyParas[0][0]) > h1End, 'body paragraph follows the h1');
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
test('C3a: the title equals params.meta_title', () => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  assert.ok(match, 'homepage renders a title element');
  assert.equal(match[1].trim(), configValue('meta_title'));
});

test('C3b: the meta description equals params.description', () => {
  const match = html.match(
    /<meta\s+name="?description"?\s+content=(?:"([^"]*)"|([^\s>]+))/,
  );
  assert.ok(match, 'homepage renders a meta description');
  assert.equal((match[1] ?? match[2]).trim(), configValue('description'));
});
