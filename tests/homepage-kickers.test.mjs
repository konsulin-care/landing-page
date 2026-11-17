// Section kickers: labels live in hugo.yaml, numbering comes from the
// section wrapper, and the kicker partial renders them.
//   K1  hugo.yaml defines the five kicker labels, hero has none
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
const LABELS = {
  why_it_matters: 'Latar belakang',
  how_it_works: 'Tiga langkah',
  claim_report: 'Laporan',
  research_credibility: 'Di balik survei',
  final_cta: 'Ikut serta',
};

test('K1a: each section defines its kicker label as the first key', () => {
  for (const [key, label] of Object.entries(LABELS)) {
    const block = homeBlock(key);
    const first = block.split('\n').find((l) => l.trim() !== '');
    assert.equal(first.trim(), `kicker: "${label}"`, `home.${key} must start with kicker "${label}"`);
  }
});

test('K1b: hero has no kicker', () => {
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
