// Hero section height-based breakpoints: disable snap, reduce padding, hide chevron on screens < 700px height
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Task 1: Height-based breakpoints replace width-based
test('T1a: uses max-height instead of max-width for small screen handling', () => {
  const css = read('assets/css/main.css');
  assert.ok(
    css.includes('@media (max-height: 699px)'),
    'CSS must use max-height: 699px breakpoint for small screens',
  );
  assert.ok(
    css.includes('@media (max-height: 399px)'),
    'CSS must use max-height: 399px breakpoint for very small screens',
  );
});

// Task 2: Snap disabled on screens with height < 700px
test('T2a: snap disabled via height breakpoint', () => {
  const css = read('assets/css/main.css');
  // Find the max-height: 699px media query and check it contains scroll-snap-type: none
  const heightBreakpointIdx = css.indexOf('@media (max-height: 699px)');
  const nextBreakpointIdx = css.indexOf('@media', heightBreakpointIdx + 10);
  const section = css.slice(heightBreakpointIdx, nextBreakpointIdx > 0 ? nextBreakpointIdx : heightBreakpointIdx + 500);
  assert.ok(
    section.includes('scroll-snap-type: none'),
    'Height < 700px must disable scroll-snap-type',
  );
  assert.ok(
    section.includes('scroll-snap-align: none'),
    'Height < 700px must disable scroll-snap-align',
  );
});

// Task 3: Padding reduced on screens with height < 700px
test('T3a: padding reduced via height breakpoint', () => {
  const css = read('assets/css/main.css');
  const heightBreakpointIdx = css.indexOf('@media (max-height: 699px)');
  const nextBreakpointIdx = css.indexOf('@media', heightBreakpointIdx + 10);
  const section = css.slice(heightBreakpointIdx, nextBreakpointIdx > 0 ? nextBreakpointIdx : heightBreakpointIdx + 500);
  assert.ok(
    section.includes('padding-top: 1rem') || section.includes('padding-top: 0.5rem'),
    'Height < 700px must reduce padding-top',
  );
  assert.ok(
    section.includes('padding-bottom: 1rem') || section.includes('padding-bottom: 0.5rem'),
    'Height < 700px must reduce padding-bottom',
  );
});

// Task 4: Chevron hidden on screens with height < 700px
test('T4a: chevron hidden via height breakpoint', () => {
  const css = read('assets/css/main.css');
  const heightBreakpointIdx = css.indexOf('@media (max-height: 699px)');
  const nextBreakpointIdx = css.indexOf('@media', heightBreakpointIdx + 10);
  const section = css.slice(heightBreakpointIdx, nextBreakpointIdx > 0 ? nextBreakpointIdx : heightBreakpointIdx + 500);
  assert.ok(
    section.includes('.scroll-snap-section--slide > a') && section.includes('display: none'),
    'Height < 700px must hide chevron',
  );
});

// Task 5: Hero image hidden on screens with height < 400px
test('T5a: hero image hidden via very small height breakpoint', () => {
  const css = read('assets/css/main.css');
  const verySmallIdx = css.indexOf('@media (max-height: 399px)');
  assert.ok(verySmallIdx > 0, 'Must have max-height: 399px breakpoint');
  const nextBreakpointIdx = css.indexOf('@media', verySmallIdx + 10);
  const section = css.slice(verySmallIdx, nextBreakpointIdx > 0 ? nextBreakpointIdx : verySmallIdx + 300);
  assert.ok(
    section.includes('.hero-image-wrapper') && section.includes('display: none'),
    'Height < 400px must hide hero image',
  );
});
