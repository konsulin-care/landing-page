// Band utilities: band-paper / band-surface set the band background and
// redefine --color-card so cards inside a band always contrast.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const styleCss = read('assets/css/style.css');

test('style.css contains compiled .band-paper and .band-surface rules', () => {
  assert.match(styleCss, /\.band-paper\s*\{/);
  assert.match(styleCss, /\.band-surface\s*\{/);
});

test('compiled rules carry the card contrast override', () => {
  const paper = styleCss.match(/\.band-paper\s*\{([^}]*)\}/)?.[1] ?? '';
  const surface = styleCss.match(/\.band-surface\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(paper, /--color-card:\s*var\(--color-surface\)/);
  assert.match(surface, /--color-card:\s*var\(--color-paper\)/);
});
