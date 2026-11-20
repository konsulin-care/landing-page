import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBuilt } from './helpers/build.mjs';
import { sectionHtml } from './helpers/html.mjs';

const SECTION_IDS = ['mulai', 'siapa', 'janji', 'cara-kerja', 'pendanaan', 'kontak'];

/**
 * Returns the rendered id values of every `<section>` in document order.
 * Works with quoted and unquoted (minified) attributes.
 * @param {string} html rendered HTML
 * @returns {string[]} section ids
 */
function sectionIds(html) {
  return [...html.matchAll(/<section\b[^>]*\sid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
}

/**
 * Reduces markup to its visible text so emptiness can be judged.
 * @param {string} value markup fragment
 * @returns {string} whitespace-normalised text without tags or entities
 */
function stripTags(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('about renders the six sections in order and no pendukung section', () => {
  const ids = sectionIds(readBuilt('about/index.html'));
  assert.deepEqual(ids, SECTION_IDS);
  assert.ok(!ids.includes('pendukung'));
});

test('every about h2 is followed by non-empty content', () => {
  const html = readBuilt('about/index.html');
  const headings = [...html.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/g)];
  assert.equal(headings.length, SECTION_IDS.length);

  for (const heading of headings) {
    const bodyStart = heading.index + heading[0].length;
    const bodyEnd = html.indexOf('</section>', bodyStart);
    assert.ok(bodyEnd > bodyStart, `section after ${heading[0]} not closed`);
    const content = stripTags(html.slice(bodyStart, bodyEnd));
    assert.ok(content.length > 0, `empty section after ${heading[0]}`);
  }
});

test('#cara-kerja links to the open-source GitHub organisation', () => {
  const body = sectionHtml(readBuilt('about/index.html'), 'cara-kerja');
  assert.match(body, /href=["']?https:\/\/github\.com\/konsulin-care["'\s>]/);
});
