import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let section = '';
let dest = '';

before(() => {
  const build = buildSite();
  assert.equal(build.status, 0, build.output);
  dest = build.dest;
  section = sectionHtml(readBuilt('index.html'), 'kalau-ikut');
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
 * Extracts the opening tags of an element name.
 * @param {string} html rendered HTML
 * @param {string} name element name
 * @returns {string[]} opening tags including attributes
 */
function openingTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

/** Reads `params.forward` from hugo.yaml. */
function forwardUrl() {
  const match = read('hugo.yaml').match(/^\s{2}forward:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
  assert.ok(match, 'params.forward is configured');
  return match[1].trim();
}

/** Reads the hero demo report bars from hugo.yaml. */
function reportBars() {
  const block = read('hugo.yaml').match(/\breport:\s*\n([\s\S]*?)\n\s{10}timeline_label:/);
  assert.ok(block, 'params.home.hero.demo.report.bars is configured');
  const bars = [...block[1].matchAll(/-\s*label:\s*"([^"]+)"\s*\n\s*value:\s*(\d+)/g)].map((match) => ({
    label: match[1],
    value: Number(match[2]),
  }));
  assert.ok(bars.length > 0, 'at least one report bar is configured');
  return bars;
}

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

test('the section renders the lead, the give card and the static sample report', () => {
  assert.match(section, /Anda memberi sedikit waktu, dan langsung mendapat laporan ringkas tentang diri Anda\./);
  assert.match(section, /Yang Anda beri/);

  const giveStart = section.indexOf('Yang Anda beri');
  const giveEnd = section.indexOf('Yang Anda dapat');
  assert.ok(giveStart >= 0 && giveEnd > giveStart, 'give and get cards are rendered in order');
  const giveCard = section.slice(giveStart, giveEnd);

  const items = [...giveCard.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
  assert.equal(items.length, 3, 'the give card lists three items');

  const expected = [
    ['Sepuluh menit\.', 'Boleh berhenti kapan saja\.'],
    ['Jawaban jujur\.', 'Tidak ada jawaban benar atau salah\.'],
    ['Bukan nama Anda\.', 'ID Anonim dibuat otomatis\.'],
  ];
  items.forEach((item, index) => {
    const [title, text] = expected[index];
    assert.match(item, new RegExp(title), `give item ${index + 1} renders its title`);
    assert.match(item, new RegExp(text), `give item ${index + 1} renders its text`);

    const svgs = openingTags(item, 'svg');
    assert.equal(svgs.length, 1, `give item ${index + 1} renders one Lucide icon`);
    assert.equal(attr(svgs[0], 'aria-hidden'), 'true', `give item ${index + 1} icon is decorative`);
    assert.match(svgs[0], /viewBox\s*=\s*["']?0 0 24 24/i, `give item ${index + 1} icon is a Lucide svg`);
  });

  assert.match(section, /Yang Anda dapat/);
  assert.match(section, /Laporan Anda/);
  assert.match(section, /Tersedia begitu survei selesai\. Hasil skrining, bukan diagnosis\./);

  const getCard = section.slice(section.indexOf('Yang Anda dapat'));
  const badge = openingTags(getCard, 'span').find((tag) => (attr(tag, 'class') ?? '').includes('bg-turquoise-tint'));
  assert.ok(badge, 'the sample report renders a turquoise-tint badge');
  assert.match(badge, /\brounded-lg\b/);
  const badgeContent = getCard.slice(getCard.indexOf(badge) + badge.length, getCard.indexOf('</span>', getCard.indexOf(badge)));
  assert.match(badgeContent, /Contoh/);

  for (const bar of reportBars()) {
    assert.match(getCard, new RegExp(bar.label), `bar ${bar.label} is labelled`);
    assert.match(getCard, new RegExp(`width:\\s*${bar.value}%`), `bar ${bar.label} has an inline width`);
  }
  assert.match(getCard, /bg-turquoise/);
});

test('the section no longer renders the old step cards or assurance chips', () => {
  assert.doesNotMatch(section, /Isi Survei\./);
  assert.doesNotMatch(section, /Dapatkan ID Anonim\./);
  assert.doesNotMatch(section, /Lihat Laporan Anda\./);
  assert.doesNotMatch(section, />Gratis</);
  assert.doesNotMatch(section, /Bukan diagnosis<\/li>/);
});

test('the FAQ accordion shares one state and only the first answer starts expanded', () => {
  const wrapper = openingTags(section, 'div').find((tag) => /open:\s*0/.test(attr(tag, 'x-data') ?? ''));
  assert.ok(wrapper, 'the accordion shares one x-data state starting at zero');

  const buttons = openingTags(section, 'button').filter((tag) => (attr(tag, 'aria-controls') ?? '').startsWith('faq-kalau-ikut-'));
  assert.equal(buttons.length, 3, 'the accordion renders three questions');
  assert.equal(attr(buttons[0], 'aria-expanded'), 'true', 'only the first answer starts expanded');
  assert.equal(attr(buttons[1], 'aria-expanded'), 'false', 'the second answer starts collapsed');
  assert.equal(attr(buttons[2], 'aria-expanded'), 'false', 'the third answer starts collapsed');

  buttons.forEach((button, index) => {
    assert.match(attr(button, '@click') ?? '', new RegExp(`open\\s*=\\s*open\\s*===\\s*${index}`), `button ${index + 1} toggles its answer`);
    assert.match(attr(button, ':aria-expanded') ?? '', new RegExp(`open\\s*===\\s*${index}`), `button ${index + 1} binds its expanded state`);
  });

  const firstAnswerId = attr(buttons[0], 'aria-controls');
  const answer = openingTags(section, 'div').find((tag) => attr(tag, 'id') === firstAnswerId);
  assert.ok(answer, 'the first answer is rendered');
  assert.match(attr(answer, 'x-show') ?? '', /^open\s*===\s*0$/, 'the first answer is bound to the shared state');
  assert.doesNotMatch(answer, /\bx-cloak\b/, 'the first answer does not depend on JavaScript to be readable');

  assert.match(section, /Apakah saya harus memberi email\?/);
  assert.match(section, /Siapa yang bisa melihat jawaban saya\?/);
  assert.match(section, /Apakah ini diagnosis\?/);
  assert.match(section, /\[&_a\]:font-semibold/);
  const help = openingTags(section, 'a').find((tag) => normalizeHref(attr(tag, 'href') ?? '') === '/faq/#bantuan');
  assert.ok(help, 'the third answer links to /faq/#bantuan');
});

test('the CTA comes before the research study link', () => {
  const cta = openingTags(section, 'a').find((tag) => attr(tag, 'data-cta-location') === 'kalau-ikut');
  assert.ok(cta, 'the section renders the if-join CTA');
  assert.equal(normalizeHref(attr(cta, 'href')), normalizeHref(forwardUrl()));

  const ctaContent = section.slice(section.indexOf(cta) + cta.length, section.indexOf('</a>', section.indexOf(cta)));
  assert.match(ctaContent, /Mulai Survei \(10 Menit\)/);

  const ctaIndex = section.indexOf(cta);
  const researchIndex = section.indexOf('/research/jadi-tangguh/');
  assert.ok(researchIndex > ctaIndex, 'the research study link follows the CTA');
});

test('the section links to a research study page that exists in the build', () => {
  const hrefs = [...section.matchAll(/<a\b[^>]*>/g)]
    .map((match) => attr(match[0], 'href'))
    .filter((href) => href !== null)
    .map(normalizeHref)
    .filter((href) => /^\/research\/[^/]+\/$/.test(href));

  assert.ok(hrefs.length > 0, 'the section links to a /research/<slug>/ page');

  for (const href of hrefs) {
    const pagePath = path.join(dest, href.replace(/^\//, ''), 'index.html');
    assert.ok(fs.existsSync(pagePath), `${href} is rendered as a page in the build`);
  }
});
