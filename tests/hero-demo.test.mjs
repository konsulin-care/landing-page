import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { sectionHtml } from './helpers/html.mjs';

let hero;

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  hero = sectionHtml(readBuilt('index.html'), 'hero');
});

test('text column order-1, right column order-2 with demo figure', () => {
  assert.match(hero, /class="order-1 text-left[^"]*"[^>]*data-hero-text/);
  assert.match(hero, /class="order-2 hero-image-wrapper"[^>]*>\s*<figure data-hero-demo/);
});

test('three stages bound to i !== k', () => {
  const stages = hero.match(/<div data-hero-demo-stage[^>]*>/g) || [];
  assert.equal(stages.length, 3);
  stages.forEach((s, k) => {
    assert.ok(s.includes(`i !== ${k}`), s);
    assert.equal(/invisible opacity-0/.test(s), k !== 0);
  });
});

test('stage 1 content and caption', () => {
  assert.match(hero, /Contoh pertanyaan/);
  assert.match(hero, /Merasa gugup, cemas, atau gelisah/);
  const btns = hero.match(/<button type="?button"? class="?min-h-11 rounded-lg border border-border text-left[^">]*/g) || [];
  assert.equal(btns.length, 4);
  assert.match(hero, /<figcaption[^>]*>[\s\S]*Contoh alur survei[\s\S]*Jawaban di sini tidak disimpan/);
});
