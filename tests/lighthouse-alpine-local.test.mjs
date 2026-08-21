// Lighthouse performance fix: self-host Alpine.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('package.json has copy:alpine script', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts?.['copy:alpine'], 'copy:alpine script must exist');
  assert.ok(
    pkg.scripts['copy:alpine'].includes('alpinejs/dist/cdn.min.js'),
    'copy:alpine must copy from node_modules/alpinejs/dist/cdn.min.js',
  );
  assert.ok(
    pkg.scripts['copy:alpine'].includes('assets/js/alpine.min.js'),
    'copy:alpine must copy to assets/js/alpine.min.js',
  );
});

test('build script runs copy:alpine before hugo', () => {
  const pkg = JSON.parse(read('package.json'));
  const build = pkg.scripts?.build || '';
  assert.ok(
    build.includes('copy:alpine'),
    'build script must call copy:alpine',
  );
  // copy:alpine must come before hugo
  const copyIdx = build.indexOf('copy:alpine');
  const hugoIdx = build.indexOf('hugo');
  assert.ok(
    copyIdx < hugoIdx,
    'copy:alpine must run before hugo in build script',
  );
});

test('start script runs copy:alpine before concurrently', () => {
  const pkg = JSON.parse(read('package.json'));
  const start = pkg.scripts?.start || '';
  assert.ok(
    start.includes('copy:alpine'),
    'start script must call copy:alpine',
  );
  const copyIdx = start.indexOf('copy:alpine');
  const concIdx = start.indexOf('concurrently');
  assert.ok(
    copyIdx < concIdx,
    'copy:alpine must run before concurrently in start script',
  );
});

test('footer.html does not reference jsdelivr CDN for Alpine', () => {
  const footer = read('layouts/partials/footer.html');
  assert.ok(
    !footer.includes('cdn.jsdelivr.net/npm/alpinejs'),
    'footer.html must not reference jsdelivr CDN for Alpine.js',
  );
});

test('footer.html loads local Alpine via fingerprint', () => {
  const footer = read('layouts/partials/footer.html');
  assert.ok(
    footer.includes('js/alpine.min.js'),
    'footer.html must reference local alpine.min.js',
  );
  assert.ok(
    footer.includes('fingerprint'),
    'Alpine.js must be fingerprinted',
  );
  assert.ok(
    footer.includes('$alpine.Data.Integrity') || footer.includes('$alpine.Data.integrity'),
    'Alpine.js script tag must include integrity attribute',
  );
});

test('assets/js/alpine.min.js is in .gitignore', () => {
  const gitignore = read('.gitignore');
  assert.ok(
    gitignore.includes('assets/js/alpine.min.js'),
    'assets/js/alpine.min.js must be gitignored (build artifact)',
  );
});
