// Final CTA on the charcoal band: paper text, no card wrapper, and a
// button.html pill that points where the hero CTA points, followed by a
// FAQ escape hatch.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let hero = '';
let finalCta = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  const html = readBuilt('index.html');
  hero = sectionHtml(html, 'hero');
  finalCta = sectionHtml(html, 'final-cta');
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
 * @returns {Array<{ tag: string, href: string|null, index: number }>} matching anchors in document order
 */
function anchorsWithClass(markup, tokens) {
  return [...markup.matchAll(/<a\b[^>]*>/g)]
    .map((match) => {
      const tag = match[0];
      const classes = (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
      return { tag, href: attr(tag, 'href'), index: match.index ?? 0, classes };
    })
    .filter(({ classes }) => tokens.every((token) => classes.includes(token)));
}

/** Reads `params.forward` from hugo.yaml. */
function forwardUrl() {
  const match = read('hugo.yaml').match(/^\s{2}forward:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
  assert.ok(match, 'params.forward is configured');
  return match[1].trim();
}

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

test('final-cta headline and body use paper text, never muted or foreground', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.match(partial, /<h2[^>]*text-background/, 'headline uses text-background');
  assert.match(partial, /<p[^>]*text-background/, 'body uses text-background');
  assert.ok(!partial.includes('text-muted-foreground'), 'no text-muted-foreground on charcoal');
  assert.ok(!/<h2[^>]*text-foreground/.test(partial), 'headline must not use text-foreground');
});

test('final-cta has no card wrapper and no rail grid', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(!partial.includes('bg-card'), 'no bg-card');
  assert.ok(!/\bborder\b/.test(partial.replace(/\{\{[\s\S]*?\}\}/g, '')), 'no border classes');
  assert.ok(!partial.includes('grid-cols-12'), 'no 12-column rail');
});

test('final-cta pill CTA points where the hero pill CTA points and to params.forward', () => {
  const expected = normalizeHref(forwardUrl());

  const heroPills = anchorsWithClass(hero, ['rounded-full']);
  assert.equal(heroPills.length, 1, 'hero renders exactly one button.html pill CTA');

  const finalPills = anchorsWithClass(finalCta, ['rounded-full']);
  assert.equal(finalPills.length, 1, 'final-cta renders exactly one button.html pill CTA');

  assert.ok(heroPills[0].href, 'hero pill has an href');
  assert.equal(
    normalizeHref(finalPills[0].href),
    normalizeHref(heroPills[0].href),
    'final CTA points where the hero CTA points',
  );
  assert.equal(normalizeHref(finalPills[0].href), expected, 'final CTA points at params.forward');
});

test('a /faq/ link renders after the final-cta pill CTA', () => {
  const [cta] = anchorsWithClass(finalCta, ['rounded-full']);
  assert.ok(cta, 'final-cta renders the pill CTA');

  const faq = [...finalCta.matchAll(/<a\b[^>]*>/g)]
    .map((match) => ({ tag: match[0], index: match.index ?? 0 }))
    .find(({ tag, index }) => {
      const href = attr(tag, 'href');
      if (!href || index <= cta.index) return false;
      return /^\/faq\/?$/.test(normalizeHref(href));
    });

  assert.ok(faq, 'a /faq/ link renders after the CTA');
  const classes = (attr(faq.tag, 'class') ?? '').split(/\s+/).filter(Boolean);
  assert.ok(classes.includes('text-background'), 'the FAQ link stays readable on charcoal');
});
