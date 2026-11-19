// Hero progress segments, swipe wiring and the labelled chevron: the text
// column exposes a story-style segment per headline line, swipes between pairs,
// and the chevron reveals its label once cycled.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let hero = '';
let textColumn = '';
let segmentsMarkup = '';
let chevronMarkup = '';

/** Number of configured hero headline lines. */
function heroLineCount() {
  const block = read('hugo.yaml').match(/^ {6}lines:\n((?: {8}- .*\n)+)/m);
  assert.ok(block, 'params.home.hero.lines is configured');
  return block[1].split('\n').filter(Boolean).length;
}

/** Configured params.home.recognition.kicker value. */
function recognitionKicker() {
  const home = read('hugo.yaml').match(/^ {2}home:\n([\s\S]*?)^ {2}social_media:/m);
  assert.ok(home, 'params.home is configured');
  const recognition = home[1].match(/^ {4}recognition:\n([\s\S]*?)^ {4}[a-z_]+:/m);
  assert.ok(recognition, 'params.home.recognition is configured');
  const kicker = recognition[1].match(/^ {6}kicker:\s*["']?([^"'\n]+?)["']?\s*$/m);
  assert.ok(kicker, 'params.home.recognition.kicker is configured');
  return kicker[1].trim();
}

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

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);

  hero = sectionHtml(readBuilt('index.html'), 'hero');

  textColumn = hero.match(/<div\b[^>]*\bdata-hero-text\b[^>]*>/)?.[0] ?? '';
  assert.ok(textColumn, 'the text column declares data-hero-text');

  const segmentsStart = hero.search(/<div\b[^>]*\bdata-hero-segments\b/);
  assert.ok(segmentsStart >= 0, 'the hero renders the segment container');
  const h1Start = hero.search(/<h1[\s>]/);
  assert.ok(h1Start >= 0, 'the hero renders an h1');
  assert.ok(segmentsStart < h1Start, 'progress segments render before the h1');
  segmentsMarkup = hero.slice(segmentsStart, h1Start);

  const chevron = hero.match(/<a\b[^>]*aria-label=(?:"Lanjut ke bagian berikutnya"|Lanjut[^>]*)>/);
  assert.ok(chevron, 'the hero renders the down chevron anchor');
  const chevronStart = chevron.index ?? 0;
  const chevronEnd = hero.indexOf('</a>', chevronStart);
  assert.ok(chevronEnd > chevronStart, 'the chevron anchor closes');
  chevronMarkup = hero.slice(chevronStart, chevronEnd + '</a>'.length);
});

test('the hero renders one segment button per headline line before the h1', () => {
  const count = heroLineCount();
  const buttons = [...segmentsMarkup.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(buttons.length, count, 'one segment button per configured line');

  buttons.forEach((tag, index) => {
    const classes = (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
    assert.ok(classes.includes('min-h-11'), `segment ${index + 1} has a 44px tap area`);

    assert.equal(attr(tag, 'type'), 'button', `segment ${index + 1} is a button`);
    assert.equal(
      attr(tag, 'aria-label'),
      `Pesan ${index + 1} dari ${count}`,
      `segment ${index + 1} is labelled with its position`,
    );
    assert.equal(
      attr(tag, '@click'),
      `select(${index})`,
      `segment ${index + 1} selects its pair`,
    );

    const buttonStart = segmentsMarkup.indexOf(tag);
    const buttonEnd = segmentsMarkup.indexOf('</button>', buttonStart);
    const buttonMarkup = segmentsMarkup.slice(buttonStart, buttonEnd);

    const fill = buttonMarkup.match(/<span\b[^>]*:style="[^"]*progress\(\)[^"]*"[^>]*>/)?.[0] ?? '';
    assert.ok(fill, `segment ${index + 1} renders a fill bound to progress()`);
    assert.match(attr(fill, ':style') ?? '', /width/, 'the fill binds its width');
    assert.match(attr(fill, ':style') ?? '', new RegExp(`i\\s*===\\s*${index}`), 'the fill tracks its own pair');
  });
});

test('the text column swipes horizontally without pausing the clock', () => {
  const classes = (attr(textColumn, 'class') ?? '').split(/\s+/).filter(Boolean);
  assert.ok(classes.includes('touch-pan-y'), 'the text column keeps vertical panning');

  assert.match(attr(textColumn, '@pointerdown') ?? '', /swipeStart\(\$event\.clientX\)/, 'pointerdown records the start x');
  assert.match(attr(textColumn, '@pointerup') ?? '', /swipeEnd\(\$event\.clientX\)/, 'pointerup compares the end x');

  for (const name of ['@pointerdown', '@pointerup', '@pointercancel']) {
    assert.doesNotMatch(attr(textColumn, name) ?? '', /hold|release/, `the text column ${name} does not pause the clock`);
  }
});

test('the chevron label shows the recognition kicker only once cycled', () => {
  assert.equal(attr(chevronMarkup.match(/<a\b[^>]*>/)?.[0] ?? '', 'aria-label'), 'Lanjut ke bagian berikutnya');

  const anchorClasses = (attr(chevronMarkup.match(/<a\b[^>]*>/)?.[0] ?? '', 'class') ?? '').split(/\s+/);
  for (const token of ['absolute', 'left-1/2', '-translate-x-1/2', 'flex', 'flex-col', 'items-center', 'gap-1']) {
    assert.ok(anchorClasses.includes(token), `the chevron anchor carries ${token}`);
  }
  assert.equal(attr(chevronMarkup.match(/<a\b[^>]*>/)?.[0] ?? '', 'href'), '#kenali-tandanya');

  const label = [...chevronMarkup.matchAll(/<span\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => attr(tag, 'x-show') === 'cycled');
  assert.ok(label, 'the chevron renders a label shown via x-show="cycled"');
  assert.ok(/\bx-cloak\b/.test(label), 'the label is hidden before Alpine boots');

  const classes = (attr(label, 'class') ?? '').split(/\s+/).filter(Boolean);
  for (const token of ['flex', 'flex-col', 'items-center', 'gap-1', 'text-sm']) {
    assert.ok(classes.includes(token), `the label is laid out with ${token}`);
  }

  const labelStart = chevronMarkup.indexOf(label);
  const labelEnd = chevronMarkup.indexOf('</span>', labelStart);
  const text = chevronMarkup.slice(labelStart + label.length, labelEnd).trim();
  assert.equal(text, recognitionKicker(), 'the label renders params.home.recognition.kicker');
});
