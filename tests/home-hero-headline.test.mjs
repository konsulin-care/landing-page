// Hero headline (T3): the #JadiTangguh tagline line-by-line in one grid cell.
//   H1  anchor points at params.hashtag_url, opens a new tab, styled tag colour
//   H2  all three lines render in config order; only line 2 is initially visible
//   H3  the Alpine component rotates slowly, respects hidden tabs, hover/focus
//       pause and prefers-reduced-motion
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

let html = '';
let hero = '';
let partial = '';

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'home-hero-headline-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
  partial = read('layouts/partials/home-hero.html');

  const start = html.search(/<h1[\s>]/);
  assert.ok(start >= 0, 'the homepage renders an h1');
  hero = html.slice(start, html.indexOf('</h1>', start));
});

/** Returns the config value of a top-level `key:` under params. */
function configValue(key) {
  const config = read('hugo.yaml');
  const m = config.match(new RegExp(`^\\s{2}${key}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm'));
  assert.ok(m, `params.${key} is configured`);
  return m[1].trim();
}

/** Returns the span tag that wraps the given line text. */
function spanTagFor(text) {
  const at = hero.indexOf(text);
  assert.ok(at >= 0, `line "${text}" is rendered`);
  const spanAt = hero.lastIndexOf('<span', at);
  assert.ok(spanAt >= 0, `line "${text}" sits in a span`);
  return hero.slice(spanAt, hero.indexOf('>', spanAt) + 1);
}

// ── H1 anchor ──────────────────────────────────────────────────────
test('H1: the h1 anchor links to hashtag_url in a new tab and is styled as the tag', () => {
  const url = configValue('hashtag_url');
  const anchor = hero.match(/<a\b[^>]*>#JadiTangguh<\/a>/);
  assert.ok(anchor, 'the h1 anchor reads #JadiTangguh');
  const tag = anchor[0];

  const href = tag.match(/href=(?:"([^"]*)"|([^\s>]+))/);
  assert.ok(href, 'anchor has an href');
  const value = (href[1] ?? href[2]).replace(/^https:\/\/konsulin\.care/, '');
  assert.equal(value, url.replace(/^https:\/\/konsulin\.care/, ''), 'href equals params.hashtag_url');

  assert.match(tag, /target=(?:"_blank"|_blank)(?:\s|>)/, 'opens in a new tab');
  assert.match(tag, /rel=(?:"[^"]*noopener[^"]*"|[^\s>]*noopener[^\s>]*)/, 'rel includes noopener');
  assert.match(tag, /class=(?:"[^"]*text-turquoise-deep[^"]*"|[^\s>]*text-turquoise-deep[^\s>]*)/);
  assert.match(tag, /class=(?:"[^"]*font-extrabold[^"]*"|[^\s>]*font-extrabold[^\s>]*)/);
});

// ── H2 lines ───────────────────────────────────────────────────────
test('H2: the three lines render in config order with only line 2 visible', () => {
  const lines = [
    'bukan berarti nggak pernah capek.',
    'itu nggak harus sendirian.',
    'itu dilatih, bukan ditahan-tahan.',
  ];
  const positions = lines.map((line) => {
    const at = hero.indexOf(line);
    assert.ok(at >= 0, `line "${line}" is rendered`);
    return at;
  });
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2], 'lines follow config order');

  const hidden = (tag) => /invisible/.test(tag) && /opacity-0/.test(tag);
  assert.ok(hidden(spanTagFor(lines[0])), 'line 1 starts hidden');
  assert.ok(!hidden(spanTagFor(lines[1])), 'line 2 starts visible');
  assert.ok(hidden(spanTagFor(lines[2])), 'line 3 starts hidden');

  assert.ok(!/aria-live/.test(hero), 'the h1 has no aria-live attribute');
});

// ── H3 Alpine behaviour ────────────────────────────────────────────
test('H3: the h1 Alpine component rotates slowly and respects user preferences', () => {
  const start = partial.search(/<h1[\s>]/);
  assert.ok(start >= 0, 'partial declares an h1');
  const component = partial.slice(start, partial.indexOf('</h1>', start));

  const interval = component.match(/setInterval\([\s\S]*?,\s*(\d{3,5})\s*\)/);
  assert.ok(interval, 'component uses setInterval');
  const ms = Number(interval[1]);
  assert.ok(ms >= 5000 && ms <= 6000, `interval ${ms}ms is between 5000 and 6000`);

  assert.match(component, /document\.hidden/, 'skips rotation in hidden tabs');
  assert.match(component, /@mouseenter=(?:"[^"]*paused\s*=\s*true[^"]*"|[^\s>]*paused)/, 'pauses on mouseenter');
  assert.match(component, /@mouseleave=(?:"[^"]*paused\s*=\s*false[^"]*"|[^\s>]*paused)/, 'resumes on mouseleave');
  assert.match(component, /@focusin=(?:"[^"]*paused\s*=\s*true[^"]*"|[^\s>]*paused)/, 'pauses on focusin');
  assert.match(component, /@focusout=(?:"[^"]*paused\s*=\s*false[^"]*"|[^\s>]*paused)/, 'resumes on focusout');

  const reduce = component.indexOf('prefers-reduced-motion: reduce');
  const intervalAt = component.indexOf('setInterval');
  assert.ok(reduce >= 0, 'checks prefers-reduced-motion');
  assert.ok(reduce < intervalAt, 'returns before starting the interval under reduced motion');
  assert.match(component.slice(reduce, intervalAt), /return/, 'returns early under reduced motion');
});
