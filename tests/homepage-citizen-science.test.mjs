// Homepage rendered-output checks: nav auth, CTAs to the research app, no
// dead anchors, and the privacy page rendering.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

let publicHtml = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  publicHtml = readBuilt('index.html');
});

/**
 * Reads a top-level key under `params` from hugo.yaml.
 * @param {string} key parameter name
 * @returns {string} configured value
 */
function configValue(key) {
  const match = read('hugo.yaml').match(new RegExp(`^\\s{2}${key}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm'));
  assert.ok(match, `params.${key} is configured`);
  return match[1].trim();
}

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

/** Returns every rendered href value, normalized against the baseURL. */
function renderedHrefs(html) {
  return [...html.matchAll(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((match) =>
    normalizeHref(match[1] ?? match[2] ?? match[3]),
  );
}

test('the homepage nav links to params.auth', () => {
  const nav = publicHtml.match(/<nav\b[^>]*id\s*=\s*"?menuItems"?[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav, 'the rendered nav menu exists');
  const auth = normalizeHref(configValue('auth'));
  const navHrefs = renderedHrefs(nav[1]);
  assert.ok(navHrefs.includes(auth), 'the nav links to params.auth');
});

test('the rendered page links every CTA to the research app and has no dead anchors', () => {
  const hrefs = renderedHrefs(publicHtml);
  assert.ok(hrefs.includes(normalizeHref(configValue('forward'))), 'forward CTA must render');
  assert.ok(hrefs.includes(normalizeHref(configValue('auth'))), 'auth CTA must render');
  assert.ok(!hrefs.includes('#'), 'no href="#" anywhere');
});

test('the privacy page renders at /privacy with an h1', () => {
  const page = readBuilt('privacy/index.html');
  assert.match(page, /<h1\b/, 'privacy page renders an h1');
});
