// Hero step strip: the always-visible three-step list under the CTA, with a
// nested Alpine flag that lights the numbered circles in sequence on
// CTA hover, focus or touch.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

const EXPECTED_STEPS = ['Isi survei', 'Dapat ID Anonim', 'Lihat laporan'];
const DELAYS = ['delay-0', 'delay-150', 'delay-300'];

let hero = '';
let strip = '';
let stripOpen = '';
let items = [];
let ctaWrapper = '';

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
 * Returns the class tokens of an opening tag.
 * @param {string} tag opening tag markup
 * @returns {string[]} class tokens
 */
function classesOf(tag) {
  return (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
}

/** Parses params.home.hero.steps from hugo.yaml in order. */
function heroSteps() {
  const block = read('hugo.yaml').match(/^ {6}steps:\n((?: {8}- .*\n)+)/m);
  assert.ok(block, 'params.home.hero.steps is configured');
  return block[1]
    .split('\n')
    .filter(Boolean)
    .map((line) => line.match(/^ {8}- (.*)$/)[1].trim().replace(/^['"]|['"]$/g, ''));
}

/** Returns the configured primary CTA label. */
function primaryCta() {
  const match = read('hugo.yaml').match(/^ {6}primary_cta:\s*["']?([^"'\n]+?)["']?\s*$/m);
  assert.ok(match, 'params.home.hero.primary_cta is configured');
  return match[1].trim();
}

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);

  hero = sectionHtml(readBuilt('index.html'), 'hero');

  const olStart = hero.search(/<ol\b[^>]*\bdata-hero-steps\b/);
  assert.ok(olStart >= 0, 'the hero renders the step strip as an ol');
  stripOpen = hero.slice(olStart, hero.indexOf('>', olStart) + 1);
  const olEnd = hero.indexOf('</ol>', olStart);
  assert.ok(olEnd > olStart, 'the step strip ol closes');
  strip = hero.slice(olStart, olEnd + '</ol>'.length);

  items = [...strip.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);

  ctaWrapper =
    [...hero.matchAll(/<div\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => attr(tag, '@mouseenter') === 'ctaActive = true') ?? '';
});

test('params.home.hero.steps lists three short labels in order', () => {
  assert.deepEqual(heroSteps(), EXPECTED_STEPS);
  for (const label of heroSteps()) {
    assert.ok(label.length <= 16, `step label "${label}" is at most 16 characters`);
  }
});

test('the strip renders after the CTA as three li with no hidden breakpoint tokens', () => {
  const ctaIndex = hero.indexOf(primaryCta());
  assert.ok(ctaIndex >= 0, 'the CTA label renders in the hero');
  assert.ok(hero.indexOf(stripOpen) > ctaIndex, 'the step strip renders after the CTA');

  const classes = classesOf(stripOpen);
  for (const banned of ['hidden', 'md:hidden', 'md:block']) {
    assert.ok(!classes.includes(banned), `the strip has no ${banned} token`);
  }

  assert.equal(items.length, EXPECTED_STEPS.length, 'one li per configured step');
  const text = items.map((item) => item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  EXPECTED_STEPS.forEach((label, index) => {
    assert.ok(text[index].includes(label), `li ${index + 1} renders "${label}"`);
  });
});

test('the CTA wrapper drives ctaActive on hover, focus and touch', () => {
  assert.ok(ctaWrapper, 'the CTA wrapper carries the ctaActive handlers');
  assert.match(hero, /x-data="\{\s*ctaActive:\s*false\s*\}"/, 'the hero nests an Alpine ctaActive flag');

  assert.equal(attr(ctaWrapper, '@mouseenter'), 'ctaActive = true', 'mouseenter activates');
  assert.equal(attr(ctaWrapper, '@mouseleave'), 'ctaActive = false', 'mouseleave deactivates');
  assert.equal(attr(ctaWrapper, '@focusin'), 'ctaActive = true', 'focusin activates');
  assert.equal(attr(ctaWrapper, '@focusout'), 'ctaActive = false', 'focusout deactivates');
  assert.equal(attr(ctaWrapper, '@touchstart.passive'), 'ctaActive = true', 'touchstart activates');
});

test('the width group wraps the full-width CTA and the steps, with a connector', () => {
  const groupTag = [...hero.matchAll(/<div\b[^>]*>/g)].map((m) => m[0]).find((t) => /ctaActive:\s*false/.test(t)) ?? '';
  const groupClasses = classesOf(groupTag);
  assert.ok(groupClasses.includes('w-full') && groupClasses.includes('sm:w-fit'), 'group is w-full sm:w-fit');
  const groupHtml = hero.slice(hero.indexOf(groupTag));
  assert.ok(groupHtml.indexOf('data-hero-steps') > 0, 'group contains the steps');
  assert.match(groupHtml, /<a\b[^>]*class="?[^">]*\bw-full\b[^>]*rounded-full|<a\b[^>]*rounded-full[^>]*\bw-full\b/, 'CTA is w-full');
  assert.match(strip, /aria-hidden="?true"?/, 'connector is aria-hidden');
  assert.match(strip, /scale-x-100/);
  assert.match(strip, /scale-x-0/);
  assert.match(strip, /motion-reduce:transition-none/);
  assert.match(strip, /:class="?ctaActive \? 'scale-x-100' : 'scale-x-0'/);
});

test('each numbered circle binds its highlight to ctaActive with a stepped delay', () => {
  items.forEach((item, index) => {
    const circle = item.match(/<span\b[^>]*>/)?.[0] ?? '';
    assert.ok(circle, `step ${index + 1} renders a numbered circle`);

    const classes = classesOf(circle);
    for (const token of [
      'flex',
      'h-6',
      'w-6',
      'items-center',
      'justify-center',
      'rounded-full',
      'border',
      'border-border',
      'transition-colors',
      'duration-300',
      'motion-reduce:transition-none',
      DELAYS[index],
    ]) {
      assert.ok(classes.includes(token), `step ${index + 1} circle has ${token}`);
    }

    const binding = attr(circle, ':class') ?? '';
    assert.match(binding, /\bctaActive\b/, `step ${index + 1} circle binds to ctaActive`);
    for (const token of ['bg-turquoise-tint', 'border-turquoise', 'text-foreground']) {
      assert.ok(binding.includes(token), `step ${index + 1} circle highlights with ${token}`);
    }

    assert.ok(binding.includes(`i === ${index}`), `step ${index + 1} circle binds to i === ${index}`);
    const labelTag = item.match(/<span\b[^>]*>(?=[^<]*<\/span>\s*$)/)?.[0] ?? '';
    const labelBinding = attr(labelTag, ':class') ?? '';
    assert.ok(labelBinding.includes(`i === ${index}`) && labelBinding.includes('font-semibold'), `step ${index + 1} label is bold when current`);

    const circleStart = item.indexOf(circle);
    const number = item.slice(circleStart + circle.length, item.indexOf('</span>', circleStart)).trim();
    assert.equal(number, String(index + 1), `step ${index + 1} circle shows its number`);
  });
});
