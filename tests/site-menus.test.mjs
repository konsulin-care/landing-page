import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

/**
 * Reads a value list for a key from a hugo.yaml menu block.
 * @param {string} block YAML fragment for one menu
 * @param {string} key menu field name
 * @returns {string[]} values in source order, with surrounding quotes removed
 */
function values(block, key) {
  const re = new RegExp(`^\\s+${key}:\\s*(.+)$`, 'gm');
  return [...block.matchAll(re)].map((match) =>
    match[1].trim().replace(/^["']|["']$/g, ''),
  );
}

/**
 * Reads the footer menu names declared in hugo.yaml.
 * @returns {string[]} footer menu names in source order
 */
function footerMenuNames() {
  const yaml = read('hugo.yaml');
  const block = yaml.split(/^ {2}footer:\n/m)[1].split(/^\S/m)[0];
  return values(block, 'name');
}

/**
 * Extracts href and text from each anchor in a markup fragment.
 * @param {string} fragment rendered HTML
 * @returns {Array<{ href: string, text: string }>} anchors in document order
 */
function anchors(fragment) {
  return [...fragment.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(
    ([, attrs, inner]) => {
      const href = attrs.match(/href=["']?([^"'\s>]+)/i);
      return {
        href: href ? href[1] : '',
        text: inner.replace(/<[^>]*>/g, '').trim(),
      };
    },
  );
}

/**
 * Returns the rendered footer markup from the home page.
 * @returns {string} footer markup including the closing tag
 */
function footerHtml() {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);

  const html = readBuilt('index.html');
  const match = html.match(/<footer[\s\S]*?<\/footer>/i);
  assert.ok(match, 'home page must render a footer');
  return match[0];
}

test('rendered footer menu lists the hugo.yaml footer names in order', () => {
  const footer = footerHtml();
  const nav = footer.match(
    /<nav[^>]*aria-label=["']?Footer["']?[^>]*>([\s\S]*?)<\/nav>/i,
  );
  assert.ok(nav, 'footer must render the Footer navigation');

  assert.deepEqual(
    anchors(nav[1]).map((link) => link.text),
    footerMenuNames(),
  );
});

test('rendered footer Legal nav links to the privacy and feature pages', () => {
  const footer = footerHtml();
  const nav = footer.match(
    /<nav[^>]*aria-label=["']?Legal["']?[^>]*>([\s\S]*?)<\/nav>/i,
  );
  assert.ok(nav, 'footer must render the Legal navigation');

  const hrefs = anchors(nav[1]).map((link) => link.href);
  assert.ok(
    hrefs.some((href) => href.endsWith('/privacy/')),
    `Legal nav links /privacy/, got ${hrefs.join(', ')}`,
  );
  assert.ok(
    hrefs.some((href) => href.endsWith('/feature/')),
    `Legal nav links /feature/, got ${hrefs.join(', ')}`,
  );
});
