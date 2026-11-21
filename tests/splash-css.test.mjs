// Splash stylesheet contract: the veil and lockup animation ship in the
// compiled stylesheet with a reduced-motion escape hatch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers/html.mjs';

const styleCss = read('assets/css/style.css');

/**
 * Collapses whitespace so assertions tolerate minified or formatted output.
 * @param {string} css raw CSS text
 * @returns {string} CSS with runs of whitespace reduced to a single space
 */
function normalize(css) {
  return css.replace(/\s+/g, ' ').trim();
}

/**
 * Returns the declaration block matching a selector, or an empty string.
 * @param {string} selector literal selector text
 * @returns {string} normalized declaration block contents
 */
function block(selector) {
  const pattern = new RegExp(
    `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`,
  );
  return normalize(styleCss.match(pattern)?.[1] ?? '');
}

test('compiled stylesheet styles the splash veil', () => {
  const veil = block('html.jt-splash body::before');
  assert.notEqual(veil, '', 'style.css must contain the splash veil rule');
  assert.match(veil, /position:\s*fixed/);
  assert.match(veil, /inset:\s*0/);
  assert.match(veil, /z-index:\s*60/);
  assert.match(veil, /background:\s*var\(--color-paper\)/);
  assert.match(veil, /pointer-events:\s*none/);
  assert.match(
    veil,
    /animation:\s*jt-splash-veil\s+400ms\s+ease-out\s+800ms\s+forwards/,
  );
});

test('compiled stylesheet animates the lockup from the centre scale', () => {
  const lockup = block('html.jt-splash-run [data-splash-logo]');
  assert.notEqual(lockup, '', 'style.css must contain the splash lockup rule');
  assert.match(lockup, /z-index:\s*61/);
  assert.match(lockup, /animation:\s*jt-splash-logo\s+1100ms\s+backwards/);

  const keyframes = normalize(
    styleCss.match(/@keyframes\s+jt-splash-logo\s*\{([\s\S]*?)\}\s*\}/)?.[1] ?? '',
  );
  assert.notEqual(keyframes, '', 'style.css must contain jt-splash-logo keyframes');
  assert.match(keyframes, /0%\s*\{\s*opacity:\s*0/);
  assert.match(
    keyframes,
    /translate\(var\(--jt-splash-x[^)]*\),\s*var\(--jt-splash-y[^)]*\)\)\s*scale\(var\(--jt-splash-scale[^)]*\)\)/,
  );
});

test('compiled stylesheet disables the splash under reduced motion', () => {
  const blockPattern = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  const reduced = [...styleCss.matchAll(blockPattern)]
    .map((match) => normalize(match[1]))
    .find((body) => body.includes('jt-splash'));
  assert.notEqual(reduced, undefined, 'style.css must contain a splash reduced-motion block');
  assert.match(reduced, /html\.jt-splash body::before\s*\{[^}]*display:\s*none/);
  assert.match(reduced, /html\.jt-splash body::before\s*\{[^}]*animation:\s*none/);
  assert.match(reduced, /html\.jt-splash-run \[data-splash-logo\]\s*\{[^}]*animation:\s*none/);
});
