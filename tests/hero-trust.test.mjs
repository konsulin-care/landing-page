// Hero trust chip: the three agreed assurance lines share the headline clock,
// render as one accessible chip inside the demo figcaption, and drop the old
// breakpoint-specific blocks.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

const EXPECTED_TRUST = [
  'Sepuluh menit, boleh berhenti kapan saja',
  'Hasil riset dibagikan kembali untuk publik',
  'Bukan diagnosis, tidak ada jawaban salah',
];

let hero = '';
let figcaption = '';
let chip = '';
let chipSpans = [];
let chipList = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  hero = sectionHtml(readBuilt('index.html'), 'hero');

  figcaption = hero.match(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/)?.[0] ?? '';
  assert.ok(figcaption, 'the demo figure renders a figcaption');

  chip = figcaption.match(/<p\b[^>]*\bdata-hero-trust\b[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
  chipSpans = [...chip.matchAll(/<span\b[^>]*>/g)].map((match) => match[0]);

  chipList = figcaption.match(/<ul\b[^>]*>[\s\S]*?<\/ul>/)?.[0] ?? '';
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

/**
 * Reads one params.home.hero.demo string so caption copy stays config data.
 * @param {string} key demo field name
 * @returns {string} configured value without surrounding quotes
 */
function demoValue(key) {
  const match = read('hugo.yaml').match(new RegExp(`^ {8}${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n]*))`, 'm'));
  assert.ok(match, `params.home.hero.demo.${key} is configured`);
  return (match[1] ?? match[2] ?? match[3] ?? '').trim();
}

/**
 * Removes every element whose class list carries `sr-only` from a markup slice.
 * @param {string} html markup slice
 * @returns {string} markup without sr-only elements
 */
function stripSrOnly(html) {
  let out = html;
  for (;;) {
    const open = out.match(/<(\w+)\b[^>]*\bclass=(?:"[^"]*\bsr-only\b[^"]*"|'[^']*\bsr-only\b[^']*'|sr-only)[^>]*>/);
    if (!open) return out;
    const end = out.indexOf(`</${open[1]}>`, open.index);
    if (end < 0) return out;
    out = out.slice(0, open.index) + out.slice(end + open[1].length + 3);
  }
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

test('the not-diagnosis assurance shows with the report preview', () => {
  const spans = [...chip.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/g)].map((match) => ({
    tag: match[0].slice(0, match[0].indexOf('>') + 1),
    text: match[1].trim(),
  }));
  assert.equal(spans.length, EXPECTED_TRUST.length, 'one span per trust item');

  const last = spans[spans.length - 1];
  assert.equal(last.text, 'Bukan diagnosis, tidak ada jawaban salah', 'the third trust span carries the not-diagnosis line');
  assert.match(attr(last.tag, ':class') ?? '', /i\s*!==\s*2\b/, 'the not-diagnosis line shows while preview 3 is active');
});

test('the hero renders exactly one trust chip inside the demo figcaption, not the text column', () => {
  assert.equal((hero.match(/\bdata-hero-trust\b/g) ?? []).length, 1, 'one trust chip');
  assert.ok(chip, 'the chip lives inside the figcaption');
  assert.match(chip, /^<p\b[^>]*\bdata-hero-trust\b/, 'the chip carries data-hero-trust');
  assert.equal(attr(chip, 'aria-hidden'), 'true', 'the visual chip is hidden from assistive tech');

  const textColumn = hero.slice(hero.indexOf('data-hero-text'), hero.indexOf('<figure'));
  assert.doesNotMatch(textColumn, /data-hero-trust/, 'the text column has no trust chip');

  const classes = (attr(chip, 'class') ?? '').split(/\s+/).filter(Boolean);
  for (const token of ['grid', 'text-sm', 'text-muted-foreground']) {
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

    assert.equal(hidden(tag), k !== 0, `trust span ${k} starts ${k === 0 ? 'visible' : 'hidden'}`);
    assert.match(attr(tag, ':class') ?? '', new RegExp(`i\\s*!==\\s*${k}\\b`), `trust span ${k} binds i !== ${k}`);
    assert.equal(
      attr(tag, ':class'),
      attr(lineSpans[k], ':class'),
      `trust span ${k} uses the same condition as headline line ${k}`,
    );
  });
});

test('the figcaption holds an sr-only list of all three trust items', () => {
  assert.match(chipList, /^<ul\b/, 'the figcaption contains the trust ul');
  const classes = (attr(chipList.slice(0, chipList.indexOf('>') + 1), 'class') ?? '').split(/\s+/).filter(Boolean);
  assert.ok(classes.includes('sr-only'), 'the trust list is sr-only');

  const items = [...chipList.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1].trim());
  assert.deepEqual(items, EXPECTED_TRUST);
});

test('the figcaption caption copy is sr-only with no visible label or note', () => {
  const chip = figcaption.match(/<p\b[^>]*\bdata-hero-trust\b[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
  const parts = [...figcaption.replace(chip, '').matchAll(/<(ul|span)\b[^>]*>[\s\S]*?<\/\1>/g)].map((match) => match[0]);
  const srOnly = (tag) => /(?:^|\s)sr-only(?:\s|$)/.test(attr(tag, 'class') ?? '');
  const note = parts.find((part) => part.startsWith('<span') && srOnly(part)) ?? '';
  assert.ok(note, 'the caption label and note render in an sr-only span');

  const text = (tag) => tag.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(text(note), `${demoValue('label')}. ${demoValue('note')}`, 'the caption renders the configured label and note');

  const visible = stripSrOnly(figcaption.replace(chip, '')).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(visible, '', 'the figcaption exposes no visible caption copy');
});

test('no breakpoint-specific trust block remains in the hero', () => {
  assert.doesNotMatch(hero, /\bhidden\s+md:block\b/, 'no hidden md:block trust list');
  assert.doesNotMatch(hero, /\bmd:hidden\b/, 'no md:hidden trust carousel');
});
