// Remaining sections: title and line-height convention
//   F1  how-it-works: title uses responsive scale
//   F2  how-it-works: card paragraphs use responsive line-height
//   F3  claim-report: title uses responsive scale
//   F4  claim-report: note paragraph uses responsive line-height
//   F5  research-credibility: title uses responsive scale
//   F6  research-credibility: card paragraphs use responsive line-height
//   F7  final-cta: paragraph uses responsive line-height
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── F1 how-it-works title ──────────────────────────────────────────
test('F1: how-it-works title uses text-lg sm:text-xl md:text-2xl lg:text-3xl', () => {
  const partial = read('layouts/partials/home-how-it-works.html');
  assert.ok(
    partial.includes('text-lg sm:text-xl md:text-2xl lg:text-3xl'),
    'how-it-works title must use "text-lg sm:text-xl md:text-2xl lg:text-3xl"',
  );
});

// ── F2 how-it-works card line-height ───────────────────────────────
test('F2: how-it-works card paragraphs use leading-6 md:leading-8', () => {
  const partial = read('layouts/partials/home-how-it-works.html');
  assert.ok(
    partial.includes('leading-6 md:leading-8'),
    'how-it-works card paragraphs must use "leading-6 md:leading-8"',
  );
});

// ── F3 claim-report title ──────────────────────────────────────────
test('F3: claim-report title uses text-lg sm:text-xl md:text-2xl lg:text-3xl', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    partial.includes('text-lg sm:text-xl md:text-2xl lg:text-3xl'),
    'claim-report title must use "text-lg sm:text-xl md:text-2xl lg:text-3xl"',
  );
});

// ── F4 claim-report note line-height ───────────────────────────────
test('F4: claim-report note paragraph uses leading-6 md:leading-8', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  // The note is inside a div with bg-slate-50
  const noteMatch = partial.match(/bg-slate-50[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  assert.ok(noteMatch, 'claim-report must have a note paragraph');
  assert.ok(
    noteMatch[0].includes('leading-6 md:leading-8'),
    'claim-report note paragraph must use "leading-6 md:leading-8"',
  );
});

// ── F5 research-credibility title ──────────────────────────────────
test('F5: research-credibility title uses text-lg sm:text-xl md:text-2xl lg:text-3xl', () => {
  const partial = read('layouts/partials/home-research-credibility.html');
  assert.ok(
    partial.includes('text-lg sm:text-xl md:text-2xl lg:text-3xl'),
    'research-credibility title must use "text-lg sm:text-xl md:text-2xl lg:text-3xl"',
  );
});

// ── F6 research-credibility card line-height ───────────────────────
test('F6: research-credibility card paragraphs use leading-6 md:leading-8', () => {
  const partial = read('layouts/partials/home-research-credibility.html');
  assert.ok(
    partial.includes('leading-6 md:leading-8'),
    'research-credibility card paragraphs must use "leading-6 md:leading-8"',
  );
});

// ── F7 final-cta line-height ───────────────────────────────────────
test('F7: final-cta paragraph uses leading-6 md:leading-8', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(
    partial.includes('leading-6 md:leading-8'),
    'final-cta paragraph must use "leading-6 md:leading-8"',
  );
});
