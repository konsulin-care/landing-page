// Scroll indicator markup: every page renders one display-only rail, and the
// indicator script loads before Alpine so the x-data factory exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, readBuilt } from './helpers/build.mjs';

const ROOT = path.join(import.meta.dirname, '..');

/** Pages that must carry the indicator. */
const PAGES = ['index.html', 'research/index.html', 'faq/index.html', 'about/index.html', 'blog/index.html'];

/**
 * Reads an HTML attribute from an opening tag, accepting double-quoted,
 * single-quoted and unquoted (minified) values.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|undefined} attribute value, or undefined when absent
 */
function attribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

/**
 * Collects the opening tags of every scroll indicator rail in a page.
 * @param {string} html rendered page markup
 * @returns {string[]} matching opening tags
 */
function indicators(html) {
  return html.match(/<div[^>]*data-scroll-indicator[^>]*>/g) ?? [];
}

/**
 * Returns the script src values in document order.
 * @param {string} html rendered page markup
 * @returns {string[]} script source paths
 */
function scriptSources(html) {
  return [...html.matchAll(/<script[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
}

buildSite();

test('every page renders exactly one hidden, display-only indicator rail', () => {
  for (const page of PAGES) {
    const html = readBuilt(page);
    const found = indicators(html);
    assert.equal(found.length, 1, `${page} must render exactly one scroll indicator`);
    const [tag] = found;
    const classes = (attribute(tag, 'class') ?? '').split(/\s+/);
    assert.equal(attribute(tag, 'aria-hidden'), 'true', `${page} indicator must be aria-hidden`);
    assert.ok(classes.includes('pointer-events-none'), `${page} indicator must not capture pointer events`);
    assert.ok(classes.includes('hidden'), `${page} indicator must be hidden by default`);
    assert.ok(classes.includes('pointer-fine:block'), `${page} indicator must show for fine pointers only`);
    assert.equal(attribute(tag, 'x-data'), 'jtScrollIndicator()', `${page} indicator must bind the Alpine factory`);
  }
});

test('the scroll indicator script loads before Alpine on every page', () => {
  for (const page of PAGES) {
    const sources = scriptSources(readBuilt(page));
    const scroll = sources.findIndex((src) => src.includes('scroll-indicator'));
    const alpine = sources.findIndex((src) => src.includes('alpine'));
    assert.notEqual(scroll, -1, `${page} must load the scroll indicator script`);
    assert.notEqual(alpine, -1, `${page} must load Alpine`);
    assert.ok(scroll < alpine, `${page} must register jtScrollIndicator before Alpine starts`);
  }
});

test('compiled stylesheet gates the indicator on a fine pointer', () => {
  const styleCss = fs.readFileSync(path.join(ROOT, 'assets/css/style.css'), 'utf8');
  const rule = styleCss.match(/@media\s*\(pointer:\s*fine\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  assert.notEqual(rule, '', 'style.css must contain a pointer: fine media block');
  assert.match(rule, /\.pointer-fine\\:block/, 'the pointer: fine block must carry the block utility');
});
