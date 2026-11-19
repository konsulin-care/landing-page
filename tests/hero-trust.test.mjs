// Hero trust chip: the three agreed assurance lines share the headline clock,
// render as one accessible chip directly under the h1, and drop the old
// breakpoint-specific blocks.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

const EXPECTED_TRUST = [
  'Bukan diagnosis, tidak ada jawaban salah',
  'Hasil riset dibagikan kembali untuk publik',
  'Sepuluh menit, boleh berhenti kapan saja',
];

let hero = '';
let chip = '';
let chipSpans = [];
let chipList = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  hero = sectionHtml(readBuilt('index.html'), 'hero');

  const afterHeadline = hero.slice(hero.indexOf('</h1>') + '</h1>'.length);
  const firstTag = afterHeadline.match(/^\s*(<[^>]+>)/)?.[1] ?? '';
  assert.match(firstTag, /^<p\b/, 'the first element after the h1 is the trust chip');

  const start = afterHeadline.indexOf(firstTag);
  const end = afterHeadline.indexOf('</p>', start);
  chip = afterHeadline.slice(start, end + '</p>'.length);
  chipSpans = [...chip.matchAll(/<span\b[^>]*>/g)].map((match) => match[0]);

  const afterChip = afterHeadline.slice(end + '</p>'.length);
  chipList = afterChip.match(/<ul\b[^>]*>[\s\S]*?<\/ul>/)?.[0] ?? '';
});

/**
 * Returns an attribute value from an opening tag, supporting quoted and
 * unquoted (minified) attributes.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|null} decoded attribute value, or null when absent
 */
function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3];
}

/** Parses the configured hero trust strings in order. */
function heroTrust() {
  const block = read('hugo.yaml').match(/^ {6}trust:\n((?: {8}- .*\n)+)/m);
  assert.ok(block, 'params.home.hero.trust is configured');
  return block[1]
    .split('\n')
    .filter(Boolean)
    .map((line) => line.match(/^ {8}- (.*)$/)[1].trim().replace(/^['"]|['"]$/g, ''));
}

/** Returns the number of configured hero headline lines. */
function heroLineCount() {
  const block = read('hugo.yaml').match(/^ {6}lines:\n((?: {8}- .*\n)+)/m);
  assert.ok(block, 'params.home.hero.lines is configured');
  return block[1].split('\n').filter(Boolean).length;
}

/** Returns the h1 line span opening tags. */
function headlineSpans() {
  const headline = hero.slice(hero.search(/<h1[\s>]/));
  const block = headline.slice(headline.search(/<span[^>]*\bgrid\b[^>]*>/));
  return [...block.matchAll(/<span\b[^>]*\bcol-start-1\b[^>]*>/g)].map((match) => match[0]);
}

test('params.home.hero.trust lists the three agreed strings in pair order', () => {
  assert.deepEqual(heroTrust(), EXPECTED_TRUST);
  assert.equal(heroTrust().length, heroLineCount(), 'trust pairs match the headline pair count');
});

test('the hero renders exactly one trust chip directly after the h1', () => {
  assert.equal((hero.match(/\bdata-hero-trust\b/g) ?? []).length, 1, 'one trust chip');
  assert.match(chip, /^<p\b[^>]*\bdata-hero-trust\b/, 'the chip carries data-hero-trust');
  assert.equal(attr(chip, 'aria-hidden'), 'true', 'the visual chip is hidden from assistive tech');

  const classes = (attr(chip, 'class') ?? '').split(/\s+/).filter(Boolean);
  for (const token of ['mt-4', 'grid', 'text-sm', 'text-muted-foreground']) {
    assert.ok(classes.includes(token), `chip has ${token}`);
  }
});

test('each trust span mirrors the matching headline line transition and binding', () => {
  assert.equal(chipSpans.length, EXPECTED_TRUST.length, 'one span per trust item');

  const hidden = (tag) => /\binvisible\b/.test(tag) && /\bopacity-0\b/.test(tag);
  const lineSpans = headlineSpans();

  chipSpans.forEach((tag, k) => {
    const classes = (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
    for (const token of [
      'col-start-1',
      'row-start-1',
      'transition-[opacity,visibility]',
      'duration-700',
      'motion-reduce:transition-none',
    ]) {
      assert.ok(classes.includes(token), `trust span ${k} has ${token}`);
    }

    assert.equal(hidden(tag), k !== 1, `trust span ${k} starts ${k === 1 ? 'visible' : 'hidden'}`);
    assert.match(attr(tag, ':class') ?? '', new RegExp(`i\\s*!==\\s*${k}\\b`), `trust span ${k} binds i !== ${k}`);
    assert.equal(
      attr(tag, ':class'),
      attr(lineSpans[k], ':class'),
      `trust span ${k} uses the same condition as headline line ${k}`,
    );
  });
});

test('the chip is followed by an sr-only list of all three trust items', () => {
  assert.match(chipList, /^<ul\b/, 'the chip is followed by a ul');
  const classes = (attr(chipList.slice(0, chipList.indexOf('>') + 1), 'class') ?? '').split(/\s+/).filter(Boolean);
  assert.ok(classes.includes('sr-only'), 'the trust list is sr-only');

  const items = [...chipList.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1].trim());
  assert.deepEqual(items, EXPECTED_TRUST);
});

test('no breakpoint-specific trust block remains in the hero', () => {
  assert.doesNotMatch(hero, /\bhidden\s+md:block\b/, 'no hidden md:block trust list');
  assert.doesNotMatch(hero, /\bmd:hidden\b/, 'no md:hidden trust carousel');
});
