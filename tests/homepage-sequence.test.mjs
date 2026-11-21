import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { parseSections, sectionHtml, sectionClasses } from './helpers/html.mjs';

let html = '';
let sections = [];

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  html = readBuilt('index.html');
  sections = parseSections();
});

/**
 * Returns the DOM ids of the rendered homepage sections, in document order.
 * @param {string} markup rendered HTML
 * @returns {string[]} section ids in document order
 */
function renderedSectionIds(markup) {
  const ids = [];
  const re = /<section\s+[^>]*id="?([a-z0-9-]+)"?/g;
  let match = re.exec(markup);
  while (match !== null) {
    ids.push(match[1]);
    match = re.exec(markup);
  }
  return ids;
}

test('the rendered homepage lists the registered sections in order', () => {
  assert.deepEqual(
    renderedSectionIds(html),
    sections.map((section) => section.id),
    'rendered sections follow the layouts/index.html registry order',
  );
});

/**
 * Returns the document-order index of a section id in the rendered homepage.
 * @param {string} markup rendered HTML
 * @param {string} id section DOM id
 * @returns {number} zero-based position, or -1 when the section is missing
 */
function positionOf(markup, id) {
  return renderedSectionIds(markup).indexOf(id);
}

/**
 * Asserts that the given section ids appear in the rendered homepage, in order.
 * Other sections may be inserted between them without breaking the assertion.
 * @param {string} markup rendered HTML
 * @param {string[]} ids section ids that must appear in relative order
 */
function assertRelativeOrder(markup, ids) {
  const positions = ids.map((id) => positionOf(markup, id));
  for (let index = 0; index < positions.length; index += 1) {
    assert.notEqual(positions[index], -1, `section ${ids[index]} is rendered`);
    if (index === 0) continue;
    assert.ok(
      positions[index] > positions[index - 1],
      `section ${ids[index]} renders after ${ids[index - 1]}`,
    );
  }
}

test('the homepage sections keep their agreed relative order', () => {
  assertRelativeOrder(html, [
    'hero',
    'makna-tangguh',
    'kenali-tandanya',
    'kenapa-dicatat',
    'kalau-ikut',
    'final-cta',
  ]);
});

test('the homepage alternates paper and surface bands', () => {
  assert.ok(sectionClasses(html, 'makna-tangguh').includes('band-paper'));
  assert.ok(sectionClasses(html, 'kenapa-dicatat').includes('band-paper'));
  for (const id of ['kenali-tandanya', 'kalau-ikut']) {
    const classes = sectionClasses(html, id);
    assert.ok(classes.includes('band-surface'), `${id} uses the surface band`);
    assert.ok(classes.includes('border-y'), `${id} has a vertical hairline`);
    assert.ok(classes.includes('border-border'), `${id} uses the border token`);
  }
});

test('the numbered homepage kickers follow the new band order', () => {
  assert.match(sectionHtml(html, 'makna-tangguh'), /01 · Makna tangguh/);
  assert.match(sectionHtml(html, 'kenali-tandanya'), /02 · Kenali tandanya/);
});
