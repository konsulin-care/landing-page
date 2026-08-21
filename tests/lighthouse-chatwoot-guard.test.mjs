// Lighthouse performance fix: guard Chatwoot loader against placeholder secrets
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('Chatwoot loader checks for placeholder URL before loading', () => {
  const footer = read('layouts/partials/footer.html');
  // Must have a guard that checks if BASE_URL starts with '{' (placeholder)
  assert.ok(
    footer.includes("BASE_URL.charAt(0) === '{'") || footer.includes("BASE_URL.charAt(0)===\"{\""),
    'Chatwoot loader must check if BASE_URL starts with placeholder character',
  );
});

test('Chatwoot loader returns early when placeholders detected', () => {
  const footer = read('layouts/partials/footer.html');
  // Must have an early return in loadChatwoot function
  const loadChatwootIdx = footer.indexOf('function loadChatwoot()');
  assert.ok(loadChatwootIdx !== -1, 'loadChatwoot function must exist');
  
  // Find the guard statement after function declaration
  const afterFunc = footer.slice(loadChatwootIdx);
  assert.ok(
    afterFunc.includes('return;') || afterFunc.includes('return '),
    'loadChatwoot must have an early return for placeholders',
  );
});

test('Chatwoot BASE_URL is declared at function scope, not inside IIFE', () => {
  const footer = read('layouts/partials/footer.html');
  // Find loadChatwoot function
  const loadChatwootIdx = footer.indexOf('function loadChatwoot()');
  assert.ok(loadChatwootIdx !== -1, 'loadChatwoot function must exist');
  
  // Find the IIFE (immediately invoked function expression) that creates the script tag
  const iifeIdx = footer.indexOf('(function(d,t)');
  
  // BASE_URL should be declared before the IIFE (at function scope)
  // The line "var BASE_URL = ..." should appear between loadChatwoot and the IIFE
  if (iifeIdx !== -1) {
    const beforeIIFE = footer.slice(loadChatwootIdx, iifeIdx);
    assert.ok(
      beforeIIFE.includes('var BASE_URL'),
      'BASE_URL must be declared at function scope, before the IIFE',
    );
  }
});

test('Chatwoot IIFE does not redeclare BASE_URL', () => {
  const footer = read('layouts/partials/footer.html');
  // Find the IIFE
  const iifeIdx = footer.indexOf('(function(d,t)');
  if (iifeIdx !== -1) {
    // Find the closing of the IIFE (matching parenthesis)
    // Look for the closing of the script tag insertion
    const iifeContent = footer.slice(iifeIdx, iifeIdx + 500);
    // Should NOT have "var BASE_URL" inside the IIFE anymore
    assert.ok(
      !iifeContent.includes('var BASE_URL'),
      'IIFE must not redeclare BASE_URL (use outer scope variable)',
    );
  }
});
