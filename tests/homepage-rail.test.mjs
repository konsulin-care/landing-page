import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, parseSections, sectionHtml } from './helpers/html.mjs';

const HERO_PARTIAL = 'home-hero.html';
const FINAL_CTA_PARTIAL = 'home-final-cta.html';
const TRUST_PARTIAL = 'home-trust.html';

let html = '';
let railSections = [];
let kickers = {};

/**
 * Returns the index of the class attribute that contains the given token.
 * @param {string} markup section markup
 * @param {string} token class token to find
 * @returns {number} match index, or -1 when no class attribute carries the token
 */
function classTokenIndex(markup, token) {
  const re = /class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match = re.exec(markup);
  while (match !== null) {
    const value = match[1] ?? match[2] ?? match[3];
    if (value.split(/\s+/).includes(token)) return match.index;
    match = re.exec(markup);
  }
  return -1;
}

/** Returns the hugo.yaml home section keys mapped to their kicker labels. */
function parseHomeKickers() {
  const out = {};
  let inHome = false;
  let current = null;
  for (const line of read('hugo.yaml').split('\n')) {
    if (/^  home:\s*$/.test(line)) {
      inHome = true;
      current = null;
      continue;
    }
    if (!inHome) continue;
    if (/^  #/.test(line) || /^\s*$/.test(line)) continue;
    if (/^  \S/.test(line) && !/^    /.test(line)) break;
    const keyMatch = line.match(/^    ([a-z0-9_]+):\s*$/);
    if (keyMatch) {
      current = keyMatch[1];
      out[current] = out[current] ?? {};
      continue;
    }
    const kickerMatch = line.match(/^      kicker:\s*"?(.*?)"?\s*$/);
    if (kickerMatch && current) out[current].kicker = kickerMatch[1];
  }
  return out;
}

/** Derives the hugo.yaml home key for a partial, honouring an explicit key. */
function sectionKey(section) {
  if (section.key) return section.key;
  return section.partial
    .replace(/^home-/, '')
    .replace(/\.html$/, '')
    .replace(/-/g, '_');
}

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  html = readBuilt('index.html');
  railSections = parseSections().filter(
    (section) =>
      section.partial !== HERO_PARTIAL &&
      section.partial !== FINAL_CTA_PARTIAL &&
      section.partial !== TRUST_PARTIAL,
  );
  kickers = parseHomeKickers();
});

test('each rendered rail section uses a 12-column grid with a 4-column heading and 8-column content', () => {
  for (const section of railSections) {
    const markup = sectionHtml(html, section.id);
    const grid = classTokenIndex(markup, 'md:grid-cols-12');
    const heading = classTokenIndex(markup, 'md:col-span-4');
    const content = classTokenIndex(markup, 'md:col-span-8');

    assert.ok(grid >= 0, `${section.id} renders a md:grid-cols-12 grid`);
    assert.ok(heading >= 0, `${section.id} renders a md:col-span-4 heading column`);
    assert.ok(content >= 0, `${section.id} renders a md:col-span-8 content column`);

    const h2 = markup.indexOf('<h2');
    assert.ok(h2 >= 0, `${section.id} renders an H2 heading`);
    assert.ok(heading < h2, `${section.id} places the H2 inside the 4-column heading`);
    assert.ok(h2 < content, `${section.id} places the 8-column content after the heading`);
  }
});

test('the numbered kicker precedes the H2 in each rail section', () => {
  for (const section of railSections) {
    const key = sectionKey(section);
    const label = kickers[key]?.kicker;
    assert.ok(label, `hugo.yaml params.home.${key}.kicker must exist`);

    const expected = `${String(section.num - 1).padStart(2, '0')} · ${label}`;
    const markup = sectionHtml(html, section.id);
    const position = markup.indexOf(expected);

    assert.ok(position >= 0, `${section.id} renders "${expected}"`);
    assert.ok(position < markup.indexOf('<h2'), `${section.id} kicker must come before the H2`);
  }
});
