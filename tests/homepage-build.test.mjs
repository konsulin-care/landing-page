// The committed Tailwind build covers every static utility used by the eight
// homepage partials, and the shared production Hugo build is clean.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

/** Homepage partials whose static utility classes must be in the committed stylesheet. */
const SECTION_PARTIALS = [
  'layouts/partials/home-hero.html',
  'layouts/partials/home-meaning.html',
  'layouts/partials/home-recognition.html',
  'layouts/partials/home-why-record.html',
  'layouts/partials/home-if-join.html',
  'layouts/partials/home-trust.html',
  'layouts/partials/home-final-cta.html',
  'layouts/partials/icon.html',
];

/** Hand-written classes that are not Tailwind utilities. */
const NON_UTILITY = new Set(['section-kicker', 'hero-image-wrapper', 'group']);

/**
 * Returns the static class tokens used in `class="..."` attributes.
 * Template expressions are stripped before splitting; leftover tokens that
 * still contain braces are ignored.
 * @param {string} markup raw partial source
 * @returns {Set<string>} static class tokens
 */
function staticClassTokens(markup) {
  const stripped = markup.replace(/\{\{[\s\S]*?\}\}/g, ' ');
  const tokens = new Set();
  // Only plain `class="..."` attributes; `:class="..."` bindings are skipped.
  for (const match of stripped.matchAll(/(?:^|\s)class="([^"]*)"/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (!token || token.includes('{') || token.includes('}')) continue;
      if (NON_UTILITY.has(token)) continue;
      tokens.add(token);
    }
  }
  return tokens;
}

/**
 * Escapes a utility class into its CSS selector form, e.g.
 * `md:grid-cols-3` becomes `md\:grid-cols-3`.
 * @param {string} token utility class name
 * @returns {string} escaped selector text
 */
function escapeSelector(token) {
  return token.replace(/[:/\[\]().,!#%&]/g, '\\$&');
}

test('the committed stylesheet contains a selector for every static utility class', () => {
  const styleCss = read('assets/css/style.css');
  const missing = [];
  for (const partial of SECTION_PARTIALS) {
    for (const token of staticClassTokens(read(partial))) {
      if (!styleCss.includes(`.${escapeSelector(token)}`)) missing.push(`${token} (${partial})`);
    }
  }
  assert.deepEqual(missing, [], `classes missing from assets/css/style.css: ${missing.join(', ')}`);
});

test('the shared production build exits 0 without WARN lines', () => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  const warnings = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('WARN'));
  assert.deepEqual(warnings, [], `hugo build emitted warnings:\n${warnings.join('\n')}`);
});

test('the head partial does not post-process the production stylesheet', () => {
  const source = read('layouts/partials/head.html');
  assert.ok(
    !source.includes('resources.PostProcess'),
    'layouts/partials/head.html must not reference resources.PostProcess',
  );
});
