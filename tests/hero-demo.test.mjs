import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let hero;
let figcaption = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  hero = sectionHtml(readBuilt('index.html'), 'hero');
  figcaption = hero.match(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/)?.[0] ?? '';
  assert.ok(figcaption, 'the demo figure renders a figcaption');
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

/**
 * Reads one params.home.hero.demo string, so caption copy stays config data.
 * @param {string} key demo field name (label, note)
 * @returns {string} configured value without surrounding quotes
 */
function demoValue(key) {
  const match = read('hugo.yaml').match(new RegExp(`^ {8}${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n]*))`, 'm'));
  assert.ok(match, `params.home.hero.demo.${key} is configured`);
  return (match[1] ?? match[2] ?? match[3] ?? '').trim();
}

/**
 * Removes every element whose class list carries `sr-only` from a markup slice.
 * @param {string} html markup slice
 * @returns {string} markup without sr-only elements
 */
function stripSrOnly(html) {
  let out = html;
  for (;;) {
    const open = out.match(/<(\w+)\b[^>]*\bclass=(?:"[^"]*\bsr-only\b[^"]*"|'[^']*\bsr-only\b[^']*'|sr-only)[^>]*>/);
    if (!open) return out;
    const end = out.indexOf(`</${open[1]}>`, open.index);
    if (end < 0) return out;
    out = out.slice(0, open.index) + out.slice(end + open[1].length + 3);
  }
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
  assert.equal(/Skor per aspek/.test(s), false, 'the aspect-score label is gone');
  assert.equal(/\(Contoh\)/.test(s), false, 'the example hint is gone');
  assert.equal(/Skor total/.test(s), false, 'the old score label is gone');

  const bars = [
    ['Kecemasan', '0.10', '40%'],
    ['Resiliensi', '0.25', '65%'],
  ];
  assert.equal(/Stres<\/p>/.test(s), false, 'the Stres bar is gone');
  assert.equal((s.match(/h-full bg-turquoise/g) || []).length, 2, 'two aspect bars remain');
  for (const [label, threshold, width] of bars) {
    assert.match(
      s,
      new RegExp(`${label}[\\s\\S]{0,400}progress\\(\\) >= ${threshold} \\? '${width}'`),
      `${label} bar binds its threshold and width`,
    );
  }

  assert.match(s, /Cek ulang berkala/);
  assert.match(s, /Baseline[\s\S]*Cek ulang 1[\s\S]*Cek ulang 2/);
  assert.match(s, /Simpan hasil hari ini ke akun Anda, lalu ikut lagi saat cek ulang berikutnya\./);
  assert.equal(/h-2 w-2 rounded-md bg-muted/.test(s), false, 'the old dot row is gone');
  assert.equal(/bukan diagnosis medis/.test(s), false, 'the report disclaimer is gone');
  assert.equal(/Skor ini adalah hasil skrining/.test(s), false, 'the screening disclaimer is gone');

  const save = s.match(/<span\b[^>]*data-hero-save[^>]*>/)?.[0] ?? '';
  assert.ok(save, 'the save indicator is present');
  assert.match(save, /^<span\b/, 'the save indicator is a span');
  assert.match(save, /aria-hidden=(?:"|')?true/, 'the save indicator is aria-hidden');
  assert.equal(/rounded-full/.test(save), false, 'the save indicator never uses rounded-full');
  assert.match(s, /x-show="?progress\(\) < 0\.70"?[^>]*>Simpan hasil/);
  assert.match(s, /progress\(\) >= 0\.70/);
  assert.match(s, /Tersimpan/);
});

test('micro-steps bind to progress thresholds', () => {
  for (const t of ['>= 0.10', '>= 0.25', '>= 0.70', '>= 0.4']) {
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

  const frame = hero.match(/<div class="relative rounded-lg border border-border bg-card p-4">/)?.[0] ?? '';
  assert.ok(frame, 'the preview frame is relative');
  const badge = hero.slice(hero.indexOf(frame) + frame.length).match(/^\s*(<span\b[^>]*>Contoh<\/span>)/)?.[1] ?? '';
  assert.ok(badge, 'the visible Contoh badge is the first child of the frame');
  const badgeClasses = (attr(badge, 'class') ?? '').split(/\s+/).filter(Boolean);
  for (const token of ['absolute', '-top-3', 'left-4', 'rounded-lg', 'border', 'border-border', 'bg-card', 'px-2', 'text-xs', 'font-semibold', 'text-muted-foreground']) {
    assert.ok(badgeClasses.includes(token), `badge has ${token}`);
  }

  assert.equal(hero.match(/\bdata-hero-trust\b/g)?.length, 1, 'the figcaption carries the single trust chip');
  assert.match(figcaption, /\bdata-hero-trust\b/, 'the trust chip lives in the figcaption');

  const text = (tag) => tag.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const srOnly = (tag) => /(?:^|\s)sr-only(?:\s|$)/.test(attr(tag, 'class') ?? '');
  const chip = figcaption.match(/<p\b[^>]*\bdata-hero-trust\b[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
  assert.ok(chip, 'the trust chip is a paragraph');

  const parts = [...figcaption.replace(chip, '').matchAll(/<(ul|span)\b[^>]*>[\s\S]*?<\/\1>/g)].map((match) => match[0]);
  const note = parts.find((part) => part.startsWith('<span') && srOnly(part)) ?? '';
  assert.ok(note, 'the caption label and note render in an sr-only span');
  assert.equal(text(note), `${demoValue('label')}. ${demoValue('note')}`, 'the caption renders the configured label and note');

  const visible = stripSrOnly(figcaption.replace(chip, '')).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(visible, '', 'the figcaption exposes no visible caption copy');
});
