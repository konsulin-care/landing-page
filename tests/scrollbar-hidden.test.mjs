// Native scrollbar: hidden site-wide so the overlay indicator is the only
// scroll affordance and the page looks the same on every OS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const styleCss = read('assets/css/style.css');

test('compiled html rule hides the native scrollbar in Firefox and recent Chrome', () => {
  const html = styleCss.match(/(?:^|[{}|])\s*html\s*\{([^}]*)\}/m)?.[1] ?? '';
  assert.notEqual(html, '', 'style.css must contain an html rule');
  assert.match(html, /scrollbar-width:\s*none/);
});

test('compiled stylesheet hides the WebKit scrollbar', () => {
  const webkit = styleCss.match(/html::-webkit-scrollbar\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.notEqual(webkit, '', 'style.css must contain an html::-webkit-scrollbar rule');
  assert.match(webkit, /display:\s*none/);
});
