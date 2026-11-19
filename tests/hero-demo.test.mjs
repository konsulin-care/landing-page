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

/**
 * Returns an attribute value from an opening tag, supporting quoted and
 * unquoted (minified) attributes.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|null} attribute value, or null when absent
 */
function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3];
}

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

test('stage ID stacks anonymous ID cards', () => {
  const s = hero.split('data-hero-demo-stage')[2].split('data-hero-demo-stage')[0].replace(/^[^>]*>/, '');
  assert.match(s, /tanpa nama/);
  assert.equal(/>JT-••••</.test(s), false, 'the old masked value is gone');
  assert.equal(/h-2 w-2 rounded-md bg-turquoise/.test(s), false, 'the old dot row is gone');

  const tags = [...s.matchAll(/<div\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g)].map((match) => match[0]);
  const cards = tags.filter((tag) => /aria-hidden=(?:"|')?true/.test(tag) && /progress\(\)/.test(tag));
  assert.equal(cards.length, 5, 'one card per configured ID count');

  const thresholds = ['0.00', '0.12', '0.24', '0.36', '0.48'];
  cards.forEach((card, k) => {
    assert.ok(card.includes(`progress() >= ${thresholds[k]}`), `card ${k} threshold`);
    assert.match(s, new RegExp(`x-text=(?:"|')?ids\\[${k}\\]`), `card ${k} binds ids[${k}]`);
  });

  for (const card of cards.slice(0, 4)) {
    assert.match(card, /opacity-70/, 'early cards use opacity-70');
    assert.equal(/opacity-100/.test(card), false, 'early cards never use opacity-100');
    assert.equal(/border-turquoise/.test(card), false, 'early cards keep the default border');
  }

  const last = cards[4];
  assert.match(last, /opacity-100/, 'the last card uses opacity-100');
  assert.equal(/opacity-70/.test(last), false, 'the last card never uses opacity-70');
  assert.match(last, /border-turquoise/, 'the last card carries the turquoise border');
  assert.match(s, /ID Anonim Anda/);
});

test('stage report content', () => {
  const s = hero.split('data-hero-demo-stage')[3];
  assert.match(s, /Laporan Anda/);
  assert.match(s, /Baseline/);
  assert.match(s, /Skor total[\s\S]*Contoh/);
  assert.match(s, /bukan diagnosis medis\./);
  assert.match(s, /Skor ini adalah hasil skrining untuk keperluan penelitian saja/);
});

test('micro-steps bind to progress thresholds', () => {
  for (const t of ['>= 0.25', '>= 0.5', '>= 0.75', '>= 0.4']) {
    assert.ok(hero.includes(`progress() ${t}`), t);
  }
});

test('options answer, nudge the CTA and confirm', () => {
  for (let k = 0; k < 4; k += 1) {
    assert.ok(hero.includes(`answer(${k})`), `answer(${k})`);
    assert.ok(hero.includes(`picked === ${k}`), `picked === ${k}`);
  }
  assert.match(hero, /jt-cta-nudge/);
  assert.match(hero, /aria-pressed/);
  assert.match(hero, /x-show="?picked !== null"?[^>]*>Tidak ada jawaban salah/);
  assert.match(hero, /@jt-cta-nudge\.window="?ctaActive = true/);
  assert.equal((hero.match(/rounded-full[^>]*>[^<]*<\/a>|<a [^>]*rounded-full/g) || []).length <= 1, true);
});

test('the demo figure pauses the rotating clock', () => {
  const figure = hero.match(/<figure\b[^>]*\bdata-hero-demo\b[^>]*>/)?.[0] ?? '';
  assert.ok(figure, 'the demo figure declares data-hero-demo');
  assert.match(figure, /^<figure data-hero-demo\b/, 'data-hero-demo stays the first attribute');

  const enter = attr(figure, '@pointerenter') ?? '';
  assert.match(enter, /hold\('hover'\)/, 'pointerenter holds hover');
  assert.match(enter, /\$event\.pointerType\s*===\s*'mouse'/, 'hover only pauses for a mouse pointer');

  const leave = attr(figure, '@pointerleave') ?? '';
  assert.match(leave, /release\('hover'\)/, 'pointerleave releases hover');
  assert.match(leave, /release\('press'\)/, 'pointerleave releases press');

  assert.match(attr(figure, '@pointerdown') ?? '', /hold\('press'\)/, 'pointerdown holds press');
  assert.match(attr(figure, '@pointerup') ?? '', /release\('press'\)/, 'pointerup releases press');
  assert.match(attr(figure, '@pointercancel') ?? '', /release\('press'\)/, 'pointercancel releases press');
  assert.ok(!/@focus/.test(figure), 'the demo figure has no focus handlers');
});

test('stage 1 content and caption', () => {
  assert.match(hero, /Contoh pertanyaan/);
  assert.match(hero, /Merasa gugup, cemas, atau gelisah/);
  const btns = hero.match(/<button type="?button"? class="?min-h-11 rounded-lg border border-border text-left[^">]*/g) || [];
  assert.equal(btns.length, 4);
  assert.match(hero, /<figcaption[^>]*>[\s\S]*Contoh alur survei[\s\S]*Jawaban di sini tidak disimpan/);
});
