import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let section = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  section = sectionHtml(readBuilt('index.html'), 'kenali-tandanya');
});

/**
 * Returns an attribute value from an opening tag, supporting quoted and
 * unquoted (minified) attributes.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|null} attribute value, or null when absent
 */
function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3];
}

/** Reads `params.hashtag_url` from hugo.yaml. */
function hashtagUrl() {
  const config = read('hugo.yaml');
  const match = config.match(/^\s{2}hashtag_url:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
  assert.ok(match, 'params.hashtag_url is configured');
  return match[1].trim();
}

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

test('the closing #JadiTangguh anchor links to params.hashtag_url in a new tab', () => {
  const expected = normalizeHref(hashtagUrl());
  const anchors = [...section.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]);
  const anchor = anchors.find((tag) => {
    const href = attr(tag, 'href');
    return href !== null && normalizeHref(href) === expected;
  });

  assert.ok(anchor, `an anchor links to params.hashtag_url (${hashtagUrl()})`);
  assert.equal(attr(anchor, 'target'), '_blank', 'the anchor opens in a new tab');
  assert.match(attr(anchor, 'rel') ?? '', /noopener/, 'rel includes noopener');
});
