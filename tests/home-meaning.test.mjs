import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { sectionHtml } from './helpers/html.mjs';

let section = '';

before(() => {
  const build = buildSite();
  assert.equal(build.status, 0, build.output);
  section = sectionHtml(readBuilt('index.html'), 'makna-tangguh');
});

/**
 * Splits a class attribute value into tokens.
 * @param {string} value class attribute content
 * @returns {string[]} non-empty class tokens
 */
function tokens(value) {
  return value.split(/\s+/).filter(Boolean);
}

/**
 * Parses a class attribute value, supporting quoted and unquoted (minified) values.
 * @param {string} tag opening tag markup
 * @returns {string[]|null} class tokens, or null when the tag has no class attribute
 */
function classTokens(tag) {
  const match = tag.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/);
  if (!match) return null;
  return tokens(match[1] ?? match[2] ?? match[3]);
}

/**
 * Collects opening tags with a class attribute in the section.
 * @returns {Array<{ tag: string, name: string, classes: string[], index: number }>} matching tags in source order
 */
function classedTags() {
  return [...section.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/g)]
    .map((match) => {
      const classes = classTokens(match[0]);
      return classes
        ? { tag: match[0], name: match[1], classes, index: match.index ?? 0 }
        : null;
    })
    .filter(Boolean);
}

/**
 * Escapes a string for safe use inside a regular expression.
 * @param {string} value raw text
 * @returns {string} regex-escaped text
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('the section renders the compact research lead instead of the old long lead', () => {
  const lead = 'Dalam riset, ini disebut resiliensi psikologis: proses belajar beradaptasi, pelan-pelan.';
  assert.ok(section.includes(lead), `renders the new lead: ${lead}`);
  assert.ok(
    !section.includes('Tangguh adalah nama gerakan kita.'),
    'the old long lead is no longer rendered',
  );
});

test('the section renders one bordered card with three not-versus-is rows in order', () => {
  const cardTags = classedTags().filter(
    ({ classes }) =>
      classes.includes('rounded-lg') &&
      classes.includes('border') &&
      classes.includes('border-border') &&
      classes.includes('bg-card'),
  );
  assert.equal(cardTags.length, 1, 'exactly one rounded-lg bordered bg-card card');

  const cardMarkup = section.slice(cardTags[0].index);
  assert.match(cardMarkup, /class="[^"]*\bdivide-y\b[^"]*"/, 'rows are separated by divide-y');
  assert.match(cardMarkup, /class="[^"]*\bdivide-border\b[^"]*"/, 'hairlines use divide-border');

  const rows = [...cardMarkup.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
  assert.equal(rows.length, 3, 'the card holds three rows');

  const expected = [
    { not: 'pura-pura baik-baik saja', is: 'Mengenali apa yang kita alami' },
    { not: 'menahan-nahan perasaan', is: 'Mencari cara yang cocok, termasuk berhenti sebentar' },
    { not: 'menghadapi semuanya sendiri', is: 'Mencari dan menerima dukungan' },
  ];

  expected.forEach(({ not, is }, index) => {
    const row = rows[index];
    assert.match(
      row,
      /<span\b[^>]*\bclass\s*=\s*(?:"[^"]*text-muted-foreground[^"]*"|'[^']*text-muted-foreground[^']*'|text-muted-foreground)[^>]*>\s*Bukan\s*<\/span>/,
      `row ${index + 1} labels the crossed-out phrase with a muted "Bukan"`,
    );
    assert.match(
      row,
      new RegExp(`<s>\\s*${escapeRegex(not)}\\s*</s>`),
      `row ${index + 1} strikes through "${not}"`,
    );
    const bold = row.match(/<([a-z][a-z0-9]*)\b[^>]*\bclass\s*=\s*"[^"]*\bfont-semibold\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/);
    assert.ok(bold, `row ${index + 1} has a bold phrase`);
    assert.ok(
      (classTokens(bold[0]) ?? []).includes('text-foreground'),
      `row ${index + 1} bold phrase uses text-foreground`,
    );
    assert.equal(bold[2].trim(), is, `row ${index + 1} bold phrase is "${is}"`);
  });
});

test('the section is compact on the rail with a smaller heading', () => {
  const wrapper = classedTags().find(
    ({ name, classes }) => name === 'div' && classes.includes('max-w-6xl') && classes.includes('mx-auto'),
  );
  assert.ok(wrapper, 'the section uses the max-w-6xl mx-auto rail wrapper');
  for (const token of ['px-6', 'py-12', 'md:px-8', 'md:py-16']) {
    assert.ok(wrapper.classes.includes(token), `wrapper uses ${token}`);
  }

  const heading = classedTags().find(({ name }) => name === 'h2');
  assert.ok(heading, 'the section renders an h2');
  for (const token of ['text-2xl', 'md:text-3xl']) {
    assert.ok(heading.classes.includes(token), `h2 uses ${token}`);
  }
});
