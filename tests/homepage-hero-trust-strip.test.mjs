// Hero trust strip: desktop inline, mobile Alpine carousel
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── Task 1: trust params are simple strings ─────────────────────────────────

test('T1a: trust items are strings, not objects with icon+text', () => {
  const yaml = read('hugo.yaml');
  assert.ok(!yaml.includes('icon: clock'), 'trust must not reference icon: clock');
  assert.ok(!yaml.includes('icon: fingerprint'), 'trust must not reference icon: fingerprint');
  assert.ok(!yaml.includes('icon: file'), 'trust must not reference icon: file');
});

test('T1b: trust items contain the new text values', () => {
  const yaml = read('hugo.yaml');
  assert.ok(yaml.includes('"Privasi terjaga"'), 'trust must include "Privasi terjaga"');
  assert.ok(yaml.includes('"Untuk penelitian"'), 'trust must include "Untuk penelitian"');
  assert.ok(yaml.includes('"Laporan hasil langsung tersedia"'), 'trust must include "Laporan hasil langsung tersedia"');
});

// T1c removed — trust text is content-driven, not verbatim-tested

// ── Task 2: hero template ───────────────────────────────────────────────────

test('T2a: no SVG icons in the trust strip area', () => {
  const hero = read('layouts/partials/home-hero.html');
  // Extract trust section (between Desktop comment and Down chevron comment)
  const trustStart = hero.indexOf('{{/* Desktop: all items inline */}}');
  const trustEnd = hero.indexOf('{{/* Down chevron');
  const trustSection = hero.slice(trustStart, trustEnd > 0 ? trustEnd : hero.length);
  assert.ok(!trustSection.includes('<svg'), 'hero trust strip must not contain SVG icons');
});

test('T2b: old ul/li trust structure is removed', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(!hero.includes('<ul'), 'hero trust strip must not use <ul> element');
});

test('T2c: desktop shows all items inline with middot separator', () => {
  const hero = read('layouts/partials/home-hero.html');
  // Desktop block: visible on md+, uses Hugo template to iterate trust items
  assert.ok(hero.includes('hidden md:block'), 'desktop trust must be hidden on mobile, visible on md+');
  // Check for the Hugo range pattern that iterates trust params
  assert.ok(
    hero.includes('range') && hero.includes('.trust'),
    'desktop must iterate trust items via Hugo template',
  );
  // Check middot separator is present in the range
  assert.ok(hero.includes('·'), 'desktop must use middot separator between items');
});

test('T2d: mobile Alpine carousel exists', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(hero.includes('x-data'), 'mobile carousel must use Alpine.js x-data');
  assert.ok(hero.includes('x-show'), 'mobile carousel must use x-show for item visibility');
  // init() method inside x-data is equivalent to x-init
  assert.ok(
    hero.includes('init()') || hero.includes('x-init'),
    'mobile carousel must have init method or x-init for timer setup',
  );
});

test('T2e: mobile carousel has slide transition classes', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(hero.includes('translate-x-full'), 'carousel must slide in from right (translate-x-full)');
  assert.ok(hero.includes('-translate-x-full'), 'carousel must slide out to left (-translate-x-full)');
  assert.ok(hero.includes('duration-400') || hero.includes('duration-500'), 'carousel transitions must have duration');
});

test('T2f: mobile carousel uses 3-second interval', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(hero.includes('3000'), 'carousel must use 3000ms interval');
});

test('T2g: mobile carousel pauses on document.hidden', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(hero.includes('document.hidden') || hero.includes('visibilitychange'), 'carousel must pause when document is hidden');
});

test('T2h: mobile carousel container has fixed height to prevent layout shift', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(hero.includes('h-6') || hero.includes('h-8') || hero.includes('h-10'), 'mobile carousel must have fixed height');
});

test('T2i: mobile carousel has overflow hidden', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(hero.includes('overflow-hidden'), 'mobile carousel must have overflow-hidden');
});

test('T2j: mobile carousel items array is properly JSON-serialized', () => {
  const hero = read('layouts/partials/home-hero.html');
  // The items array must use jsonify to produce valid JSON with quoted strings
  assert.ok(hero.includes('jsonify'), 'trust items must use Hugo jsonify for valid JSON output');
});
