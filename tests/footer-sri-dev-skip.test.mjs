// Fix SRI errors in dev mode: skip fingerprint/integrity when hugo.IsServer
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('footer.html conditionally skips fingerprint/integrity in dev mode', () => {
  const footer = read('layouts/partials/footer.html');

  // Must contain hugo.IsServer conditional (same pattern as head.html CSS)
  assert.ok(
    footer.includes('hugo.IsServer'),
    'footer.html must use hugo.IsServer to branch dev vs production',
  );
});

test('dev branch (hugo.IsServer) renders JS without fingerprint or integrity', () => {
  const footer = read('layouts/partials/footer.html');

  // Extract the hugo.IsServer block (between "if hugo.IsServer" and the next "else")
  const ifMatch = footer.match(/\{\{-?\s*if hugo\.IsServer\s*-?\}\}([\s\S]*?)\{\{-?\s*else\s*-?\}\}/);
  assert.ok(ifMatch, 'footer.html must have an if/else block for hugo.IsServer');

  const devBlock = ifMatch[1];

  // Dev block must NOT contain fingerprint
  assert.ok(
    !devBlock.includes('| fingerprint'),
    'dev branch must not fingerprint JS (causes SRI cross-origin errors via Tailscale)',
  );

  // Dev block must NOT contain minify
  assert.ok(
    !devBlock.includes('| minify'),
    'dev branch should not minify JS for easier debugging',
  );

  // Dev block must NOT contain integrity attribute
  assert.ok(
    !devBlock.includes('.Data.Integrity') && !devBlock.includes('.Data.integrity'),
    'dev branch must not add integrity attributes',
  );
});

test('production branch (else) retains fingerprint, minify, and integrity', () => {
  const footer = read('layouts/partials/footer.html');

  // Extract the else block (from {{ else }} to {{ end }})
  const elseMatch = footer.match(/\{\{-?\s*else\s*-?\}\}([\s\S]*?)\{\{-?\s*end\s*-?\}\}/);
  assert.ok(elseMatch, 'footer.html must have an else block');

  const prodBlock = elseMatch[1];

  // Production must still fingerprint
  assert.ok(
    prodBlock.includes('| fingerprint'),
    'production branch must still fingerprint JS',
  );

  // Production must still minify
  assert.ok(
    prodBlock.includes('| minify'),
    'production branch must still minify JS',
  );

  // Production must still include integrity
  assert.ok(
    prodBlock.includes('.Data.Integrity') || prodBlock.includes('.Data.integrity'),
    'production branch must include integrity attributes',
  );
});

test('all three JS scripts are inside the conditional (not partially conditional)', () => {
  const footer = read('layouts/partials/footer.html');

  // Each script should have BOTH a dev and prod variant inside the if/else
  const scripts = ['darkmode.js', 'citizen-morph.js', 'alpine.min.js'];

  for (const script of scripts) {
    const regex = new RegExp(script, 'g');
    const matches = footer.match(regex);
    // Should appear at least twice: once in dev branch, once in prod branch
    assert.ok(
      matches && matches.length >= 2,
      `${script} must appear in both dev and production branches (found ${matches?.length ?? 0} occurrences)`,
    );
  }
});
