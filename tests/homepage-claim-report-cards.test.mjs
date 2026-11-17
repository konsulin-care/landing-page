// Claim-report section: card-based layout with icons
//   CR1  hugo.yaml data structure has cards array and subtitle
//   CR2  HTML partial renders 3-column card grid
//   CR3  HTML partial renders Lucide SVG icons
//   CR4  HTML partial renders note box with title and text
//   CR5  Old body/flow/note-string keys are removed
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const config = read('hugo.yaml');
const partial = read('layouts/partials/home-claim-report.html');

// ── CR1 hugo.yaml data structure ───────────────────────────────────
test('CR1a: claim_report has subtitle field', () => {
  assert.ok(
    config.includes('subtitle:'),
    'claim_report must have a subtitle field',
  );
});

test('CR1b: claim_report has cards array', () => {
  // Check for cards: followed by array items with icon:
  assert.ok(
    /cards:\s*\n\s*- icon:/.test(config),
    'claim_report must have a cards array with icon fields',
  );
});

test('CR1c: claim_report cards array has exactly 3 items', () => {
  // Extract claim_report section and count cards
  const start = config.indexOf('claim_report:');
  const end = config.indexOf('research_credibility:');
  const section = config.slice(start, end);
  const iconCount = (section.match(/- icon:/g) || []).length;
  assert.equal(iconCount, 3, 'cards array must have exactly 3 items');
});

test('CR1d: each card has icon, title, and text fields', () => {
  assert.ok(
    /cards:[\s\S]*?icon:.*\n\s*title:.*\n\s*text:/.test(config),
    'each card must have icon, title, and text fields',
  );
});

test('CR1e: card icons are fingerprint-pattern, mail-badge, scroll-text', () => {
  assert.ok(config.includes('fingerprint-pattern'), 'must have fingerprint-pattern icon');
  assert.ok(config.includes('mail-badge'), 'must have mail-badge icon');
  assert.ok(config.includes('scroll-text'), 'must have scroll-text icon');
});

test('CR1f: claim_report has note object with title and text', () => {
  assert.ok(
    /note:\s*\n\s*title:/.test(config),
    'claim_report must have note.title',
  );
  assert.ok(
    /note:[\s\S]*?text:/.test(config),
    'claim_report must have note.text',
  );
});

// ── CR2 HTML partial renders 3-column card grid ────────────────────
test('CR2a: cards are stacked in the 8-column rail column, not a 3-column grid', () => {
  assert.ok(
    partial.includes('md:col-span-8'),
    'cards must sit in the md:col-span-8 content column',
  );
  assert.ok(
    !partial.includes('md:grid-cols-3'),
    'cards must not use md:grid-cols-3 inside the 8-column area',
  );
});

test('CR2b: partial iterates over cards array', () => {
  assert.ok(
    partial.includes('range .cards'),
    'partial must iterate over .cards',
  );
});

test('CR2c: cards use border-border rounded-lg', () => {
  assert.ok(
    partial.includes('border-border') && partial.includes('rounded-lg'),
    'cards must use border-border rounded-lg',
  );
});

test('CR2d: no shadow- or dark: classes', () => {
  assert.ok(
    !partial.includes('shadow-') && !partial.includes('dark:'),
    'no shadow-/dark: classes',
  );
});

// ── CR3 HTML partial renders Lucide SVG icons ──────────────────────
test('CR3a: partial has fingerprint-pattern SVG', () => {
  assert.ok(
    partial.includes('lucide-fingerprint-pattern') || partial.includes('fingerprint-pattern'),
    'partial must render fingerprint-pattern icon',
  );
});

test('CR3b: partial has mail-badge SVG', () => {
  assert.ok(
    partial.includes('lucide-mail-badge') || partial.includes('mail-badge'),
    'partial must render mail-badge icon',
  );
});

test('CR3c: partial has scroll-text SVG', () => {
  assert.ok(
    partial.includes('lucide-scroll-text') || partial.includes('scroll-text'),
    'partial must render scroll-text icon',
  );
});

test('CR3d: partial renders SVG elements with stroke="currentColor"', () => {
  assert.ok(
    partial.includes('stroke="currentColor"'),
    'icons must use stroke="currentColor" for theme support',
  );
});

// ── CR4 HTML partial renders note box ──────────────────────────────
test('CR4a: partial renders note title from config', () => {
  assert.ok(
    partial.includes('.note.title'),
    'partial must render note.title from config',
  );
});

test('CR4b: partial renders note text from config', () => {
  assert.ok(
    partial.includes('.note.text'),
    'partial must render note.text from config',
  );
});

test('CR4c: note box has bg-muted background', () => {
  assert.ok(
    partial.includes('bg-muted'),
    'note box must have bg-muted background',
  );
});

// ── CR5 Old body/flow/note-string keys are removed ─────────────────
test('CR5a: old body key removed from claim_report', () => {
  // Check that body: does not appear in claim_report context
  const claimSection = config.slice(config.indexOf('claim_report:'));
  const nextSection = claimSection.indexOf('\n    research_credibility:');
  const section = claimSection.slice(0, nextSection > 0 ? nextSection : 500);
  assert.ok(
    !section.includes('body:'),
    'old body key must be removed from claim_report',
  );
});

test('CR5b: old flow key removed from claim_report', () => {
  const claimSection = config.slice(config.indexOf('claim_report:'));
  const nextSection = claimSection.indexOf('\n    research_credibility:');
  const section = claimSection.slice(0, nextSection > 0 ? nextSection : 500);
  assert.ok(
    !section.includes('flow:'),
    'old flow key must be removed from claim_report',
  );
});

test('CR5c: note is now an object with title/text, not a string', () => {
  // note: should be followed by title:, not a quoted string
  const noteMatch = config.match(/note:\s*\n/);
  assert.ok(noteMatch, 'note must be an object (followed by newline and sub-keys)');
});
