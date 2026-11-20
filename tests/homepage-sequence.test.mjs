import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { parseSections } from './helpers/html.mjs';

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
