// Homepage CTA tracking: button.html renders an optional data-cta-location
// attribute, the hero and final-cta pills set it, and calls without the
// param (the nav Login pill) leave it off.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let homeHtml = '';
let hero = '';
let finalCta = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  homeHtml = readBuilt('index.html');
  hero = sectionHtml(homeHtml, 'hero');
  finalCta = sectionHtml(homeHtml, 'final-cta');
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

/**
 * Returns the anchors in rendered markup whose class list contains every
 * requested token.
 * @param {string} markup rendered HTML
 * @param {string[]} tokens class tokens that must all be present
 * @returns {Array<{ tag: string, href: string|null, text: string, index: number }>} matching anchors in document order
 */
function anchorsWithClass(markup, tokens) {
  return [...markup.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
    .map((match) => {
      const outer = match[0];
      const tag = outer.match(/^<a\b[^>]*>/)?.[0] ?? outer;
      const classes = (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
      const text = outer
        .replace(/^<a\b[^>]*>/, '')
        .replace(/<\/a>$/, '')
        .replace(/<[^>]*>/g, '')
        .trim();
      return { tag, href: attr(tag, 'href'), text, index: match.index ?? 0, classes };
    })
    .filter(({ classes }) => tokens.every((token) => classes.includes(token)));
}

/** Reads `params.forward` from hugo.yaml. */
function forwardUrl() {
  const match = read('hugo.yaml').match(/^\s{2}forward:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
  assert.ok(match, 'params.forward is configured');
  return match[1].trim();
}

/** Reads `params.auth` from hugo.yaml. */
function authUrl() {
  const match = read('hugo.yaml').match(/^\s{2}auth:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
  assert.ok(match, 'params.auth is configured');
  return match[1].trim();
}

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

test('hero CTA carries data-cta-location="hero" and points at params.forward', () => {
  const pills = anchorsWithClass(hero, ['rounded-full']);
  assert.equal(pills.length, 1, 'hero renders exactly one button.html pill CTA');

  const [pill] = pills;
  assert.equal(attr(pill.tag, 'data-cta-location'), 'hero', 'hero CTA is tagged as hero');
  assert.equal(normalizeHref(pill.href), normalizeHref(forwardUrl()), 'hero CTA points at params.forward');
  assert.equal(pill.text, 'Mulai Survei (10 Menit)', 'hero CTA keeps its label');
});

test('final-cta CTA carries data-cta-location="final-cta" and points at params.forward', () => {
  const pills = anchorsWithClass(finalCta, ['rounded-full']);
  assert.equal(pills.length, 1, 'final-cta renders exactly one button.html pill CTA');

  const [pill] = pills;
  assert.equal(attr(pill.tag, 'data-cta-location'), 'final-cta', 'final CTA is tagged as final-cta');
  assert.equal(normalizeHref(pill.href), normalizeHref(forwardUrl()), 'final CTA points at params.forward');
  assert.equal(pill.text, 'Mulai Survei (10 Menit)', 'final CTA keeps its label');
});

test('nav Login pill omits data-cta-location when no location is passed', () => {
  const loginPills = anchorsWithClass(homeHtml, ['rounded-full']).filter(
    (pill) => normalizeHref(pill.href ?? '') === normalizeHref(authUrl()),
  );

  assert.equal(loginPills.length, 1, 'the homepage renders exactly one nav Login pill');
  const [pill] = loginPills;
  assert.equal(pill.text, 'Login', 'the nav pill keeps its label');
  assert.equal(attr(pill.tag, 'data-cta-location'), null, 'the nav pill has no data-cta-location');
});
