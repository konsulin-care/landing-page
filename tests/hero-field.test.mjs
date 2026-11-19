// Hero dot field: the hero image column replaces the hero.jpg <img> with a
// canvas-driven "Lentur lalu pulih" field, a static SVG fallback for reduced
// motion, and a caption that carries every configured field state string.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

const CONFIG_KEYS = ['idle', 'pressed', 'recovering', 'settled', 'line'];

let hero = '';
let column = '';
let frame = '';
let canvas = '';
let svg = '';
let caption = '';
let captionSpan = '';

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

/**
 * Parses params.home.hero.field from hugo.yaml.
 * @returns {Record<string, string>} configured field strings keyed by state
 */
function fieldConfig() {
  const block = read('hugo.yaml').match(/^ {6}field:\n((?: {8}\w+:.*\n)+)/m);
  assert.ok(block, 'params.home.hero.field is configured');
  /** @type {Record<string, string>} */
  const values = {};
  for (const line of block[1].split('\n').filter(Boolean)) {
    const match = line.match(/^ {8}(\w+):\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return values;
}

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  hero = sectionHtml(readBuilt('index.html'), 'hero');

  const columnStart = hero.search(/<div\b[^>]*\bhero-image-wrapper\b/);
  assert.ok(columnStart >= 0, 'the hero renders the image column wrapper');
  column = hero.slice(columnStart);

  const frameStart = column.search(/<div\b[^>]*\bbg-card\b/);
  assert.ok(frameStart >= 0, 'the field frame renders');
  frame = column.slice(frameStart, column.indexOf('>', frameStart) + 1);

  const canvasStart = column.search(/<canvas\b/);
  assert.ok(canvasStart >= 0, 'the field renders a canvas');
  canvas = column.slice(canvasStart, column.indexOf('>', canvasStart) + 1);

  const svgStart = column.search(/<svg\b[^>]*\bmotion-reduce:block\b/);
  assert.ok(svgStart >= 0, 'the field renders a static fallback svg');
  const svgEnd = column.indexOf('</svg>', svgStart);
  assert.ok(svgEnd > svgStart, 'the fallback svg closes');
  svg = column.slice(svgStart, svgEnd + '</svg>'.length);

  const captionStart = column.search(/<figcaption\b/);
  assert.ok(captionStart >= 0, 'the field renders a figcaption');
  const captionEnd = column.indexOf('</figcaption>', captionStart);
  assert.ok(captionEnd > captionStart, 'the figcaption closes');
  caption = column.slice(captionStart, captionEnd + '</figcaption>'.length);

  const spanStart = caption.search(/<span\b[^>]*\bdata-jt-field-caption\b/);
  assert.ok(spanStart >= 0, 'the caption renders the state span');
  captionSpan = caption.slice(spanStart, caption.indexOf('>', spanStart) + 1);
});

test('the image column drops the hero image and renders the field frame', () => {
  assert.ok(!/<img\b/.test(column), 'the hero image column renders no img');
  assert.ok(/<figure\b[^>]*\bdata-jt-field\b/.test(column), 'the field renders a figure');

  const frameClasses = classesOf(frame);
  for (const token of [
    'relative',
    'aspect-[2/1]',
    'md:aspect-[3/2]',
    'overflow-hidden',
    'rounded-lg',
    'border',
    'border-border',
    'bg-card',
  ]) {
    assert.ok(frameClasses.includes(token), `the field frame has ${token}`);
  }

  const canvasClasses = classesOf(canvas);
  for (const token of ['jt-field-canvas', 'block', 'h-full', 'w-full', 'touch-pan-y', 'motion-reduce:hidden']) {
    assert.ok(canvasClasses.includes(token), `the canvas has ${token}`);
  }
  assert.equal(attr(canvas, 'aria-hidden'), 'true', 'the canvas is hidden from assistive tech');
});

test('the static svg fallback sits next to the canvas with 140 dots', () => {
  assert.ok(column.indexOf('<svg') > column.indexOf('<canvas'), 'the svg follows the canvas');

  const svgClasses = classesOf(svg.slice(0, svg.indexOf('>') + 1));
  for (const token of ['hidden', 'motion-reduce:block', 'h-full', 'w-full']) {
    assert.ok(svgClasses.includes(token), `the fallback svg has ${token}`);
  }
  assert.equal(attr(svg.slice(0, svg.indexOf('>') + 1), 'aria-hidden'), 'true', 'the fallback is decorative');
  assert.equal((svg.match(/<circle\b/g) ?? []).length, 140, 'the fallback draws a 14x10 dot grid');
});

test('the caption shows the configured idle state and carries every state', () => {
  const config = fieldConfig();
  for (const key of CONFIG_KEYS) {
    assert.ok(config[key], `params.home.hero.field.${key} is configured`);
  }

  assert.equal(attr(captionSpan, 'data-idle'), config.idle, 'data-idle matches the config');
  assert.equal(attr(captionSpan, 'data-pressed'), config.pressed, 'data-pressed matches the config');
  assert.equal(attr(captionSpan, 'data-recovering'), config.recovering, 'data-recovering matches the config');
  assert.equal(attr(captionSpan, 'data-settled'), config.settled, 'data-settled matches the config');

  const spanText = caption.slice(caption.indexOf(captionSpan) + captionSpan.length).split('</span>')[0];
  assert.equal(spanText.trim(), config.idle, 'the caption starts on the idle string');

  const fixedIndex = caption.indexOf(config.line);
  assert.ok(fixedIndex > caption.indexOf(captionSpan), 'the fixed line follows the state span');
  assert.match(caption, /<span\b[^>]*\bblock\b[^>]*>/, 'the fixed line is a block span');
});
