// Hero anchors and homepage metadata: the hero chevron continues the page
// sequence, every in-page link resolves, and the document metadata carries
// the configured copy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

/**
 * Returns the configured value of a top-level `key:` under params.
 * @param {string} key params key name
 * @returns {string} configured value without surrounding quotes
 */
function configValue(key) {
  const m = read('hugo.yaml').match(new RegExp(`^\\s{2}${key}:\\s*["']?(.*?)["']?\\s*$`, 'm'));
  assert.ok(m, `params.${key} is configured`);
  return m[1].trim();
}

/**
 * Strips the production canonical URL prefix from an href value.
 * @param {string} value raw href
 * @returns {string} root-relative href
 */
function normalizeHref(value) {
  return value.replace(/^https:\/\/konsulin\.care/, '');
}

/**
 * Returns every href value found in the rendered page.
 * @param {string} html rendered HTML
 * @returns {string[]} normalized href values
 */
function hrefs(html) {
  return [...html.matchAll(/href=(?:"([^"]*)"|([^\s>]+))/g)].map((match) =>
    normalizeHref(match[1] ?? match[2]),
  );
}

/** Rendered homepage markup from the shared production build. */
const html = readBuilt('index.html');

/** Rendered hero section markup. */
const hero = sectionHtml(html, 'hero');

test('the hero chevron links to #kenali-tandanya', () => {
  const chevron = hero.match(/<a\b[^>]*aria-label=(?:"Lanjut ke bagian berikutnya"|Lanjut[^>]*)>/);
  assert.ok(chevron, 'hero renders the down chevron anchor');
  assert.match(
    chevron[0],
    /href=(?:"(?:https:\/\/konsulin\.care)?#kenali-tandanya"|(?:https:\/\/konsulin\.care)?#kenali-tandanya[\s>])/,
  );
});

test('every in-page href resolves to an element id', () => {
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

test('the title equals params.meta_title', () => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  assert.ok(match, 'homepage renders a title element');
  assert.equal(match[1].trim(), configValue('meta_title'));
});

test('the meta description equals params.description', () => {
  const match = html.match(/<meta\s+name="?description"?\s+content=(?:"([^"]*)"|([^\s>]+))/);
  assert.ok(match, 'homepage renders a meta description');
  assert.equal((match[1] ?? match[2]).trim(), configValue('description'));
});
