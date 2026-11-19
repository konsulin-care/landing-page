import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

let html = '';
let hero = '';

before(() => {
  const { dest, status, output } = buildSite();
  assert.equal(status, 0, output);
  html = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');

  const start = html.search(/<h1[\s>]/);
  assert.ok(start >= 0, 'the homepage renders an h1');
  hero = html.slice(start, html.indexOf('</h1>', start));
});

/**
 * Returns an attribute value from an opening tag, supporting quoted and
 * unquoted (minified) attributes.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|null} decoded attribute value, or null when absent
 */
function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3];
}

/** Returns the config value of a top-level `key:` under params. */
function configValue(key) {
  const config = read('hugo.yaml');
  const m = config.match(new RegExp(`^\\s{2}${key}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm'));
  assert.ok(m, `params.${key} is configured`);
  return m[1].trim();
}

/** Returns the number of configured hero headline lines. */
function heroLineCount() {
  const block = read('hugo.yaml').match(/^ {6}lines:\n((?: {8}- .*\n)+)/m);
  assert.ok(block, 'params.home.hero.lines is configured');
  return block[1].split('\n').filter(Boolean).length;
}

/** Returns every line span rendered inside the h1 grid cell. */
function lineSpans() {
  const block = hero.slice(hero.search(/<span[^>]*\bgrid\b[^>]*>/));
  return [...block.matchAll(/<span\b[^>]*\bcol-start-1\b[^>]*>/g)].map((m) => m[0]);
}

test('the h1 anchor links to hashtag_url in a new tab', () => {
  const url = configValue('hashtag_url');
  const anchor = hero.match(/<a\b[^>]*>/);
  assert.ok(anchor, 'the h1 renders an anchor');

  const href = attr(anchor[0], 'href');
  assert.ok(href, 'anchor has an href');
  assert.equal(
    href.replace(/^https:\/\/konsulin\.care/, ''),
    url.replace(/^https:\/\/konsulin\.care/, ''),
    'href equals params.hashtag_url',
  );

  assert.equal(attr(anchor[0], 'target'), '_blank', 'opens in a new tab');
  assert.match(attr(anchor[0], 'rel') ?? '', /noopener/, 'rel includes noopener');
});

test('the h1 grid holds three line spans and only the second starts visible', () => {
  const spans = lineSpans();
  assert.equal(spans.length, 3, 'three line spans render in the grid');

  const hidden = (tag) => /\binvisible\b/.test(tag) && /\bopacity-0\b/.test(tag);
  assert.ok(hidden(spans[0]), 'line 1 starts hidden');
  assert.ok(!hidden(spans[1]), 'line 2 starts visible');
  assert.ok(hidden(spans[2]), 'line 3 starts hidden');

  assert.ok(!/aria-live/.test(hero), 'the h1 has no aria-live attribute');
});

test('the built h1 wires the rotation component to the configured line count', () => {
  const opening = hero.slice(0, hero.indexOf('>') + 1);
  const data = attr(opening, 'x-data');
  assert.ok(data, 'the h1 declares x-data');

  const call = data.match(/jtHeroRotation\(\s*(\d+)\s*\)/);
  assert.ok(call, 'x-data calls jtHeroRotation with a line count');
  assert.equal(Number(call[1]), heroLineCount(), 'passes params.home.hero.lines length');
});

test('the built h1 pauses on mouseenter and focusin and resumes on mouseleave and focusout', () => {
  const opening = hero.slice(0, hero.indexOf('>') + 1);
  const pause = (name) => assert.match(attr(opening, name) ?? '', /paused\s*=\s*true/, `${name} pauses rotation`);
  const resume = (name) => assert.match(attr(opening, name) ?? '', /paused\s*=\s*false/, `${name} resumes rotation`);

  pause('@mouseenter');
  resume('@mouseleave');
  pause('@focusin');
  resume('@focusout');
});
