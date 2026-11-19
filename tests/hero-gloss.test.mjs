// Headline glosses: one word per headline line becomes a dotted-underline
// button that opens a popover after the h1 without changing the line text.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let hero = '';
let headline = '';
let afterHeadline = '';
let lines = [];
let glosses = [];
let helpLabel = '';

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
 * Parses the `key: value` pairs of one YAML list entry.
 * @param {string} entry raw YAML entry text
 * @returns {Record<string, string>} field values without surrounding quotes
 */
function entryFields(entry) {
  const fields = {};
  for (const match of entry.matchAll(/(?:^|\n)\s*([a-z_]+):\s*(?:"([^"]*)"|'([^']*)'|([^\n]*))/g)) {
    fields[match[1]] = (match[2] ?? match[3] ?? match[4] ?? '').trim();
  }
  return fields;
}

/**
 * Reads the configured hero headline lines in order.
 * @returns {string[]} headline line strings
 */
function heroLines() {
  const block = read('hugo.yaml').match(/^ {6}lines:\n((?: {8}- .*\n)+)/m);
  assert.ok(block, 'params.home.hero.lines is configured');
  return block[1]
    .split('\n')
    .filter(Boolean)
    .map((line) => line.match(/^ {8}- (.*)$/)[1].trim().replace(/^['"]|['"]$/g, ''));
}

/**
 * Reads the configured hero glosses in line order.
 * @returns {Array<Record<string, string>>} gloss config entries
 */
function heroGlosses() {
  const block = read('hugo.yaml').match(/^ {6}glosses:\n([\s\S]*?)(?=^ {6}[a-z_]+:)/m);
  assert.ok(block, 'params.home.hero.glosses is configured');
  return block[1]
    .split(/^ {8}- /m)
    .slice(1)
    .map((entry) => entryFields(entry));
}

/**
 * Reads the configured params.home.recognition.help_label value.
 * @returns {string} help link label
 */
function helpLabelText() {
  const match = read('hugo.yaml').match(/^ {6}help_label:\s*(?:"([^"]*)"|'([^']*)'|([^\n]*))/m);
  assert.ok(match, 'params.home.recognition.help_label is configured');
  return (match[1] ?? match[2] ?? match[3]).trim();
}

/**
 * Returns the headline line span opening tags.
 * @returns {string[]} opening span tags in line order
 */
function lineSpans() {
  const block = headline.slice(headline.search(/<span[^>]*\bgrid\b[^>]*>/));
  return [...block.matchAll(/<span\b[^>]*\bcol-start-1\b[^>]*>/g)].map((match) => match[0]);
}

/**
 * Returns the inner markup of the headline line span at index k.
 * @param {string[]} spans line span opening tags
 * @param {number} k line index
 * @returns {string} inner markup with tags
 */
function lineInner(spans, k) {
  const start = headline.indexOf(spans[k]) + spans[k].length;
  return headline.slice(start, headline.indexOf('</span>', start));
}

/**
 * Extracts the popover markup for gloss k from after the h1.
 * @param {number} k gloss index
 * @returns {string} popover element markup
 */
function popoverMarkup(k) {
  const open = afterHeadline.match(new RegExp(`<div\\b[^>]*\\bid\\s*=\\s*["']?hero-gloss-${k}["'\\s>][^>]*>`))?.[0];
  assert.ok(open, `popover ${k + 1} renders after the h1`);
  const start = afterHeadline.indexOf(open);
  return afterHeadline.slice(start, afterHeadline.indexOf('</div>', start) + '</div>'.length);
}

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);

  hero = sectionHtml(readBuilt('index.html'), 'hero');
  const h1Start = hero.search(/<h1[\s>]/);
  assert.ok(h1Start >= 0, 'the homepage renders an h1');
  headline = hero.slice(h1Start, hero.indexOf('</h1>', h1Start));
  afterHeadline = hero.slice(hero.indexOf('</h1>', h1Start) + '</h1>'.length);

  lines = heroLines();
  glosses = heroGlosses();
  helpLabel = helpLabelText();
});

test('each configured gloss word sits in its paired headline line', () => {
  assert.equal(glosses.length, lines.length, 'one gloss per headline line');

  const spans = lineSpans();
  assert.equal(spans.length, lines.length, 'one span per headline line');

  glosses.forEach((gloss, k) => {
    assert.ok(gloss.word, `gloss ${k + 1} has a word`);
    assert.ok(lines[k].includes(gloss.word), `line ${k + 1} contains "${gloss.word}"`);

    const text = lineInner(spans, k)
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    assert.equal(text, lines[k], `line ${k + 1} keeps its configured text after glossing`);
  });
});

test('each glossed word renders as a button inside the h1', () => {
  const buttons = [...headline.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map((match) => ({
    tag: match[0].slice(0, match[0].indexOf('>') + 1),
    text: match[1].replace(/<[^>]*>/g, '').trim(),
    index: match.index ?? 0,
  }));

  glosses.forEach((gloss, k) => {
    const button = buttons.find((item) => item.text === gloss.word);
    assert.ok(button, `gloss ${k + 1} renders "${gloss.word}" as a button inside the h1`);

    const classes = (attr(button.tag, 'class') ?? '').split(/\s+/).filter(Boolean);
    for (const token of ['bg-linear-to-t', 'from-turquoise-tint', 'from-50%', 'to-transparent', 'to-50%', 'bg-no-repeat', 'bg-left-bottom', 'pb-1', 'box-decoration-clone', 'transition-[background-size]', 'motion-reduce:transition-none']) {
      assert.ok(classes.includes(token), `gloss ${k + 1} button has ${token}`);
    }
    assert.ok(!classes.includes('underline') && !classes.includes('decoration-dotted'), `gloss ${k + 1} has no underline`);
    const bound = attr(button.tag, ':class') ?? '';
    assert.ok(bound.includes(`i === ${k}`), `gloss ${k + 1} binds on its line index`);
    assert.ok(bound.includes('bg-size-[100%_100%]') && bound.includes('bg-size-[0%_100%]'), `gloss ${k + 1} sweeps`);
    assert.ok(!/bg-turquoise|from-turquoise(?!-tint)|aria-expanded/.test(bound + classes.join(' ')), `gloss ${k + 1} stays tint`);
    assert.equal(attr(button.tag, 'type'), 'button', `gloss ${k + 1} is a type=button`);
    assert.equal(attr(button.tag, 'aria-controls'), `hero-gloss-${k}`, `gloss ${k + 1} controls its popover`);
    assert.match(attr(button.tag, '@click') ?? '', /openGloss/, `gloss ${k + 1} opens its popover`);
  });
});

test('each popover sits outside the h1 and closes on outside click and Escape', () => {
  glosses.forEach((gloss, k) => {
    const markup = popoverMarkup(k);
    const tag = markup.slice(0, markup.indexOf('>') + 1);

    assert.equal(attr(tag, 'role'), 'dialog', `popover ${k + 1} is a dialog`);
    assert.equal(attr(tag, 'aria-label'), gloss.word, `popover ${k + 1} is labelled with its word`);
    assert.equal(attr(tag, 'x-show'), `gloss === ${k}`, `popover ${k + 1} is shown for its gloss index`);
    assert.match(attr(tag, '@click.outside') ?? '', /closeGloss\(\)/, `popover ${k + 1} closes on outside click`);
    assert.match(
      attr(tag, '@keydown.escape.window') ?? '',
      /closeGloss\(\)/,
      `popover ${k + 1} closes on Escape`,
    );

    const classes = (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
    for (const token of ['rounded-lg', 'border', 'bg-card', 'p-4', 'text-sm']) {
      assert.ok(classes.includes(token), `popover ${k + 1} has ${token}`);
    }

    for (const token of ['absolute', 'inset-x-0', 'top-full', 'z-10']) {
      assert.ok(classes.includes(token), `popover ${k + 1} has ${token}`);
    }
    assert.ok(!classes.includes('mt-3'), `popover ${k + 1} has no mt-3`);

    const text = markup.slice(tag.length).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    assert.ok(text.includes(gloss.text), `popover ${k + 1} renders its configured text`);
  });
});

test('the first gloss links to help and the rest link to the meaning section', () => {
  const anchorOf = (k) => {
    const markup = popoverMarkup(k);
    const match = markup.match(/<a\b[^>]*>([\s\S]*?)<\/a>/);
    assert.ok(match, `popover ${k + 1} renders a link`);
    return {
      tag: match[0].slice(0, match[0].indexOf('>') + 1),
      text: match[1].replace(/<[^>]*>/g, '').trim(),
    };
  };

  const first = anchorOf(0);
  const firstHref = (attr(first.tag, 'href') ?? '').replace(/^https:\/\/konsulin\.care/, '');
  assert.equal(firstHref, '/faq/#bantuan', 'the first gloss links to the help section');
  assert.equal(first.text, helpLabel, 'the first gloss uses params.home.recognition.help_label');
  const firstClasses = (attr(first.tag, 'class') ?? '').split(/\s+/).filter(Boolean);
  for (const token of ['font-semibold', 'text-turquoise-deep', 'underline', 'underline-offset-4']) {
    assert.ok(firstClasses.includes(token), `the first gloss link has ${token}`);
  }

  [1, 2].forEach((k) => {
    const anchor = anchorOf(k);
    assert.equal(attr(anchor.tag, 'href'), '#makna-tangguh', `gloss ${k + 1} links to the meaning section`);
    assert.equal(anchor.text, 'Baca makna tangguh ↓', `gloss ${k + 1} renders the agreed label`);
  });
});
