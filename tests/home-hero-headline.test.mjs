import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let html = '';
let hero = '';
let heroRoot = '';
let textColumn = '';
let headline = '';

before(() => {
  const { dest, status, output } = buildSite();
  assert.equal(status, 0, output);
  html = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');
  hero = sectionHtml(html, 'hero');

  heroRoot = hero.match(/<div\b[^>]*\bdata-hero\b[^>]*>/)?.[0] ?? '';
  assert.ok(heroRoot, 'the hero root declares data-hero');

  textColumn = hero.match(/<div\b[^>]*\bdata-hero-text\b[^>]*>/)?.[0] ?? '';
  assert.ok(textColumn, 'the text column declares data-hero-text');

  const start = hero.search(/<h1[\s>]/);
  assert.ok(start >= 0, 'the homepage renders an h1');
  headline = hero.slice(start, hero.indexOf('</h1>', start));
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
  const block = headline.slice(headline.search(/<span[^>]*\bgrid\b[^>]*>/));
  return [...block.matchAll(/<span\b[^>]*\bcol-start-1\b[^>]*>/g)].map((m) => m[0]);
}

test('the h1 anchor links to hashtag_url in a new tab', () => {
  const url = configValue('hashtag_url');
  const anchor = headline.match(/<a\b[^>]*>/);
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

test('the h1 grid holds three line spans and only the first starts visible', () => {
  const spans = lineSpans();
  assert.equal(spans.length, 3, 'three line spans render in the grid');

  const hidden = (tag) => /\binvisible\b/.test(tag) && /\bopacity-0\b/.test(tag);
  assert.ok(!hidden(spans[0]), 'line 1 starts visible');
  assert.ok(hidden(spans[1]), 'line 2 starts hidden');
  assert.ok(hidden(spans[2]), 'line 3 starts hidden');

  assert.ok(!/aria-live/.test(headline), 'the h1 has no aria-live attribute');
});

test('the hero root wires the shared clock to the configured line count', () => {
  const data = attr(heroRoot, 'x-data');
  assert.ok(data, 'the hero root declares x-data');

  const decoded = data.replace(/&#34;|&quot;/g, '"');
  const call = decoded.match(/jtHeroSync\(\s*(\d+)\s*,\s*(\{[^)]*\})\s*\)/);
  assert.ok(call, 'x-data calls jtHeroSync with a line count and options');
  assert.equal(Number(call[1]), heroLineCount(), 'passes params.home.hero.lines length');

  const opts = JSON.parse(call[2]);
  const config = read('hugo.yaml');
  const rotation = config.match(/^ {6}rotation_ms:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
  assert.ok(rotation, 'params.home.hero.rotation_ms is configured');
  assert.equal(opts.ms, Number(rotation[1].trim()), 'passes params.home.hero.rotation_ms');
});

test('only the data-hero-text column carries the hold and release handlers', () => {
  const pause = (tag, name) => assert.match(attr(tag, name) ?? '', /hold\('(hover|focus)'\)/, `${name} holds the clock`);
  const resume = (tag, name) => assert.match(attr(tag, name) ?? '', /release\('(hover|focus)'\)/, `${name} releases the clock`);

  pause(textColumn, '@mouseenter');
  resume(textColumn, '@mouseleave');
  pause(textColumn, '@focusin');
  resume(textColumn, '@focusout');

  assert.doesNotMatch(attr(heroRoot, '@mouseenter') ?? '', /hold|paused/, 'the hero root does not pause the clock');
  assert.doesNotMatch(attr(headline.slice(0, headline.indexOf('>') + 1), '@mouseenter') ?? '', /hold|paused/, 'the h1 does not pause the clock');
});
