// Section kickers: labels live in hugo.yaml, numbering comes from the
// section wrapper, and the kicker partial renders them.
//   K1  every section except hero starts with a kicker key
//   K2  section-kicker.html renders number + middle dot + label, or label only, or nothing
//   K3  scroll-section.html exposes the visible section number (num - 1)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Returns the raw YAML block of one key under `home:` (indent 4). */
function homeBlock(key) {
  const lines = read('hugo.yaml').split('\n');
  const homeAt = lines.findIndex((l) => l === '  home:');
  assert.ok(homeAt >= 0, 'hugo.yaml has a params.home block');
  const start = lines.findIndex((l, i) => i > homeAt && l === `    ${key}:`);
  assert.ok(start >= 0, `home.${key} block exists`);
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() !== '' && !line.startsWith('     ')) break;
    body.push(line);
  }
  return body.join('\n');
}

// ── K1 labels ──────────────────────────────────────────────────────
/** Returns the keys of every block directly under `home:` (indent 4). */
function homeSectionKeys() {
  const lines = read('hugo.yaml').split('\n');
  const homeAt = lines.findIndex((l) => l === '  home:');
  assert.ok(homeAt >= 0, 'hugo.yaml has a params.home block');
  const keys = [];
  for (const line of lines.slice(homeAt + 1)) {
    if (line.trim() === '') continue;
    if (!line.startsWith('    ')) break;
    if (line.startsWith('     ')) continue;
    const match = line.match(/^    ([A-Za-z0-9_-]+):/);
    if (match) keys.push(match[1]);
  }
  return keys;
}

test('K1a: every section except hero starts with a kicker key', () => {
  const keys = homeSectionKeys().filter((key) => key !== 'hero');
  assert.ok(keys.length > 0, 'params.home has at least one non-hero section');
  for (const key of keys) {
    const first = homeBlock(key).split('\n').find((l) => l.trim() !== '');
    assert.match(first.trim(), /^kicker:\s*"[^"]+"$/, `home.${key} must start with a kicker key`);
  }
});

test('K1b: hero has no kicker', () => {
  assert.ok(homeSectionKeys().includes('hero'), 'params.home has a hero block');
  assert.ok(!/kicker:/.test(homeBlock('hero')), 'hero must not define a kicker');
});

// ── K2 kicker partial ──────────────────────────────────────────────
test('K2a: section-kicker.html renders a .section-kicker paragraph with %02d number, middle dot and label', () => {
  const html = read('layouts/partials/section-kicker.html');
  assert.ok(html.includes('class="section-kicker"'), 'uses the .section-kicker class');
  assert.ok(html.includes('printf "%02d · %s"'), 'formats number with zero padding and a middle dot');
});

test('K2b: section-kicker.html reads label and num, and renders nothing without a label', () => {
  const html = read('layouts/partials/section-kicker.html');
  assert.match(html, /with\s+\.label/, 'guards on label');
  assert.match(html, /\.num/, 'reads num');
  assert.match(html, /else/, 'has a label-only branch');
});

// ── K3 section number ──────────────────────────────────────────────
test('K3a: scroll-section.html supplies num minus one to content partials', () => {
  const html = read('layouts/partials/scroll-section.html');
  assert.match(html, /Store\.Set\s+"sectionNum"\s+\(sub\s+\$num\s+1\)/);
});
