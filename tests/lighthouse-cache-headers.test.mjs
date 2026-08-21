// Lighthouse performance fix: cache headers via static/_headers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

test('static/_headers file exists', () => {
  assert.ok(exists('static/_headers'), 'static/_headers must exist');
});

test('static/_headers sets long cache for CSS (fingerprinted)', () => {
  const content = read('static/_headers');
  assert.ok(
    content.includes('/css/*') && content.includes('max-age=31536000'),
    'must set max-age=31536000 for /css/*',
  );
  assert.ok(
    content.includes('/css/*') && content.includes('immutable'),
    'must set immutable for /css/*',
  );
});

test('static/_headers sets long cache for JS (fingerprinted)', () => {
  const content = read('static/_headers');
  assert.ok(
    content.includes('/js/*') && content.includes('max-age=31536000'),
    'must set max-age=31536000 for /js/*',
  );
  assert.ok(
    content.includes('/js/*') && content.includes('immutable'),
    'must set immutable for /js/*',
  );
});

test('static/_headers sets short cache for images', () => {
  const content = read('static/_headers');
  assert.ok(
    content.includes('/images/*') && content.includes('max-age=86400'),
    'must set max-age=86400 for /images/*',
  );
});

test('static/_headers sets short cache for favicon', () => {
  const content = read('static/_headers');
  assert.ok(
    content.includes('/favicon/*') && content.includes('max-age=86400'),
    'must set max-age=86400 for /favicon/*',
  );
});
