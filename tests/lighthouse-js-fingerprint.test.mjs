// Lighthouse performance fix: fingerprint and minify JS bundles
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('footer.html fingerprints darkmode.js with minify and integrity', () => {
  const footer = read('layouts/partials/footer.html');
  // Must pipeline: js.Build | minify | fingerprint
  assert.ok(
    footer.includes('js/darkmode.js') && footer.includes('| minify | fingerprint'),
    'darkmode.js must be piped through minify | fingerprint',
  );
  // Must output integrity attribute
  assert.ok(
    footer.includes('$js.Data.Integrity') || footer.includes('$js.Data.integrity'),
    'darkmode.js script tag must include integrity attribute',
  );
});

test('footer.html fingerprints citizen-morph.js with minify and integrity', () => {
  const footer = read('layouts/partials/footer.html');
  assert.ok(
    footer.includes('js/citizen-morph.js') && footer.includes('| minify | fingerprint'),
    'citizen-morph.js must be piped through minify | fingerprint',
  );
  assert.ok(
    footer.includes('$morph.Data.Integrity') || footer.includes('$morph.Data.integrity'),
    'citizen-morph.js script tag must include integrity attribute',
  );
});

test('footer.html does not reference unminified/unfingerprinted JS filenames directly', () => {
  const footer = read('layouts/partials/footer.html');
  // After minify|fingerprint, RelPermalink should be used (not a hardcoded .js path)
  // Check that there's no bare src="...darkmode.js" without a hash
  const lines = footer.split('\n');
  for (const line of lines) {
    // Skip the resource.Get line itself
    if (line.includes('resources.Get')) continue;
    if (line.includes('darkmode.js') && line.includes('<script')) {
      assert.ok(
        line.includes('RelPermalink'),
        'darkmode.js script tag must use RelPermalink (not hardcoded path)',
      );
    }
    if (line.includes('citizen-morph.js') && line.includes('<script')) {
      assert.ok(
        line.includes('RelPermalink'),
        'citizen-morph.js script tag must use RelPermalink (not hardcoded path)',
      );
    }
  }
});
