import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers/html.mjs';

const X_CLOAK_RULE = /\[x-cloak\]\s*\{[^}]*display:\s*none\s*!important/;

/** Skips Alpine-controlled markup until Alpine has initialised. */
test('assets/css/main.css declares [x-cloak] with display: none !important', () => {
  assert.match(read('assets/css/main.css'), X_CLOAK_RULE);
});

/** Ensures the committed Tailwind build ships the same rule. */
test('assets/css/style.css contains the [x-cloak] display: none !important rule', () => {
  assert.match(read('assets/css/style.css'), X_CLOAK_RULE);
});
