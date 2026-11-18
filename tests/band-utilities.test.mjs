// Band utilities: band-paper / band-surface set the band background and
// redefine --color-card so cards inside a band always contrast.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Extracts the body of a Tailwind `@utility <name> { ... }` block. */
function utilityBody(css, name) {
  const re = new RegExp(`@utility\\s+${name}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  assert.ok(match, `main.css defines @utility ${name}`);
  return match[1];
}

const mainCss = read('assets/css/main.css');
const styleCss = read('assets/css/style.css');

// ── U1 source ──────────────────────────────────────────────────────
test('U1a: band-paper sets background, --color-background and --color-card', () => {
  const body = utilityBody(mainCss, 'band-paper');
  assert.match(body, /background-color:\s*var\(--color-paper\)/);
  assert.match(body, /--color-background:\s*var\(--color-paper\)/);
  assert.match(body, /--color-card:\s*var\(--color-surface\)/);
});

test('U1b: band-surface swaps paper and surface', () => {
  const body = utilityBody(mainCss, 'band-surface');
  assert.match(body, /background-color:\s*var\(--color-surface\)/);
  assert.match(body, /--color-background:\s*var\(--color-surface\)/);
  assert.match(body, /--color-card:\s*var\(--color-paper\)/);
});

// ── U2 compiled ────────────────────────────────────────────────────
test('U2a: style.css contains compiled .band-paper and .band-surface rules', () => {
  assert.match(styleCss, /\.band-paper\s*\{/);
  assert.match(styleCss, /\.band-surface\s*\{/);
});

test('U2b: compiled rules carry the card contrast override', () => {
  const paper = styleCss.match(/\.band-paper\s*\{([^}]*)\}/)?.[1] ?? '';
  const surface = styleCss.match(/\.band-surface\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(paper, /--color-card:\s*var\(--color-surface\)/);
  assert.match(surface, /--color-card:\s*var\(--color-paper\)/);
});
