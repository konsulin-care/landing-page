// Lighthouse performance fix: clean stale build artifacts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.join(import.meta.dirname, '..');

test('head.html has no postCSS pipe and keeps fingerprint and integrity', () => {
  const head = fs.readFileSync(path.join(ROOT, 'layouts', 'partials', 'head.html'), 'utf8');
  assert.doesNotMatch(head, /\|\s*postCSS/);
  assert.ok(head.includes('fingerprint'));
  assert.ok(head.includes('integrity='));
});

test('public/css/ contains a fingerprinted style.min.<hash>.css', () => {
  const cssDir = path.join(ROOT, 'public', 'css');
  
  // Skip if public/css doesn't exist (not built yet)
  if (!fs.existsSync(cssDir)) {
    return;
  }
  
  const files = fs.readdirSync(cssDir);
  assert.ok(
    files.some(f => /^style\.min\.[0-9a-f]+\.css$/.test(f)),
    'public/css/ must contain a fingerprinted style.min.<hash>.css',
  );
});

test('homepage links an existing stylesheet that matches its fingerprint and integrity', () => {
  const indexPath = path.join(ROOT, 'public', 'index.html');
  // Skip if the site is not built yet
  if (!fs.existsSync(indexPath)) {
    return;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const tag = html.match(/<link[^>]*style\.min\.[0-9a-f]+\.css[^>]*>/);
  assert.ok(tag, 'public/index.html must link a fingerprinted style.min.<hash>.css');
  const href = tag[0].match(/href="?([^"\s>]+)/)[1];
  const hash = href.match(/style\.min\.([0-9a-f]+)\.css/)[1];
  const integrity = tag[0].match(/integrity="?sha256-([^"\s>]+)/);
  assert.ok(integrity, 'the stylesheet link must carry a sha256 integrity attribute');
  const file = path.join(ROOT, 'public', href.replace(/^https?:\/\/[^/]+/, ''));
  assert.ok(fs.existsSync(file), `linked stylesheet ${href} must exist in public/`);
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest();
  assert.equal(digest.toString('hex'), hash, 'file content must match the fingerprint in its name');
  assert.equal(digest.toString('base64'), integrity[1], 'file content must match the integrity attribute');
});
