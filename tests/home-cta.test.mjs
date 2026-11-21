// Homepage CTA tracking: every primary CTA inside <main> carries a
// data-cta-location attribute, and calls without the param (the nav Login
// pill) leave it off.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

let homeHtml = '';
let mainHtml = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  homeHtml = readBuilt('index.html');
  mainHtml = homeHtml.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0] ?? '';
  assert.ok(mainHtml, 'the built homepage renders a <main> element');
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

test('the four main CTAs are data-cta-location tagged in section order', () => {
  const ctas = anchorsWithClass(mainHtml, []).filter((pill) => attr(pill.tag, 'data-cta-location') !== null);
  assert.equal(ctas.length, 4, 'main renders exactly four tracked CTAs');
  assert.deepEqual(
    ctas.map((pill) => attr(pill.tag, 'data-cta-location')),
    ['hero', 'kenali-tandanya', 'kalau-ikut', 'final-cta'],
    'CTAs appear in homepage section order',
  );

  for (const pill of ctas) {
    const location = attr(pill.tag, 'data-cta-location');
    assert.ok(pill.classes.includes('rounded-full'), `${location} CTA is a rounded-full pill`);
    assert.equal(normalizeHref(pill.href), normalizeHref(forwardUrl()), `${location} CTA points at params.forward`);
    assert.equal(pill.text, 'Mulai Survei (10 Menit)', `${location} CTA keeps its label`);
  }
});

test('every rounded-full anchor inside main carries data-cta-location', () => {
  const pills = anchorsWithClass(mainHtml, ['rounded-full']);
  assert.ok(pills.length > 0, 'main renders rounded-full anchors');
  for (const pill of pills) {
    assert.notEqual(
      attr(pill.tag, 'data-cta-location'),
      null,
      `untracked rounded-full anchor: ${pill.text || pill.href}`,
    );
  }
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
