import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { sectionHtml } from './helpers/html.mjs';

let section = '';
let dest = '';

before(() => {
  const build = buildSite();
  assert.equal(build.status, 0, build.output);
  dest = build.dest;
  section = sectionHtml(readBuilt('index.html'), 'kalau-ikut');
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

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

test('the section links to a research study page that exists in the build', () => {
  const hrefs = [...section.matchAll(/<a\b[^>]*>/g)]
    .map((match) => attr(match[0], 'href'))
    .filter((href) => href !== null)
    .map(normalizeHref)
    .filter((href) => /^\/research\/[^/]+\/$/.test(href));

  assert.ok(hrefs.length > 0, 'the section links to a /research/<slug>/ page');

  for (const href of hrefs) {
    const pagePath = path.join(dest, href.replace(/^\//, ''), 'index.html');
    assert.ok(fs.existsSync(pagePath), `${href} is rendered as a page in the build`);
  }
});
