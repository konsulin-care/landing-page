// Claim-report section: responsive line-height and remove table
//   C1  Claim-report paragraphs use responsive line-height
//   C2  Claim-report table is removed
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── C1 Responsive line-height ──────────────────────────────────────
test('C1a: claim-report body paragraphs use leading-6 md:leading-8', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    partial.includes('leading-6 md:leading-8'),
    'claim-report body paragraphs must use "leading-6 md:leading-8"',
  );
});

// ── C2 Table removed ───────────────────────────────────────────────
test('C2a: claim-report partial has no table element', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    !partial.includes('<table'),
    'claim-report must not contain a table element',
  );
});

test('C2b: claim-report partial has no thead element', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    !partial.includes('<thead'),
    'claim-report must not contain a thead element',
  );
});

test('C2c: claim-report partial has no tbody element', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    !partial.includes('<tbody'),
    'claim-report must not contain a tbody element',
  );
});
