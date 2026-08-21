// Lighthouse performance fix: clean stale build artifacts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

test('public/css/ contains style.css', () => {
  const cssDir = path.join(ROOT, 'public', 'css');
  
  // Skip if public/css doesn't exist (not built yet)
  if (!fs.existsSync(cssDir)) {
    return;
  }
  
  const files = fs.readdirSync(cssDir);
  assert.ok(
    files.includes('style.css'),
    'public/css/ must contain style.css',
  );
});

test('public/css/ has at most one fingerprinted CSS file after build', () => {
  const cssDir = path.join(ROOT, 'public', 'css');
  
  // Skip if public/css doesn't exist (not built yet)
  if (!fs.existsSync(cssDir)) {
    return;
  }
  
  const files = fs.readdirSync(cssDir);
  
  // Count fingerprinted CSS files (style.min.<hash>.css)
  const fingerprinted = files.filter(f => 
    f.startsWith('style.min.') && f.endsWith('.css') && f !== 'style.min.css'
  );
  
  // Should have at most 1 fingerprinted CSS file
  // Note: This test verifies the cleanup was done. If there are multiple
  // stale files, run: find public/css -name "style.min.*.css" -type f -delete
  // (keeping only the most recent one)
  assert.ok(
    fingerprinted.length <= 1,
    `Expected at most 1 fingerprinted CSS file, found ${fingerprinted.length}. ` +
    `Run cleanup: find public/css -name "style.min.*.css" -type f -delete ` +
    `(then rebuild to get the latest fingerprint)`,
  );
});
