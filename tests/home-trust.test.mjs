// The "siapa di baliknya" section is a compact trust strip: no 4/8 rail, a
// four-item record of who is behind the study, and an ethics status line
// rendered verbatim from the research front matter.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, parseSections, sectionHtml, sectionClasses } from './helpers/html.mjs';

const RESEARCH_PAGE = 'content/research/jadi-tangguh.md';

let html = '';
let section = '';
let sections = [];

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  html = readBuilt('index.html');
  section = sectionHtml(html, 'siapa-di-baliknya');
  sections = parseSections();
});

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

/**
 * Returns the raw value of a front matter scalar.
 * @param {string} source markdown file contents
 * @param {string} key front matter key
 * @returns {string|null} unquoted scalar value, or null when absent
 */
function frontMatterValue(source, key) {
  const front = source.split('---')[1] ?? '';
  const line = front.split('\n').find((entry) => entry.startsWith(`${key}:`));
  if (!line) return null;
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
}

test('the trust section is a paper band between if-join and the final CTA', () => {
  const indexes = {
    trust: sections.findIndex((entry) => entry.id === 'siapa-di-baliknya'),
    ifJoin: sections.findIndex((entry) => entry.id === 'kalau-ikut'),
    finalCta: sections.findIndex((entry) => entry.id === 'final-cta'),
  };
  assert.ok(indexes.trust >= 0, 'the section is registered in layouts/index.html');
  assert.ok(indexes.ifJoin < indexes.trust, 'it renders after kalau-ikut');
  assert.ok(indexes.trust < indexes.finalCta, 'it renders before final-cta');

  const classes = sectionClasses(html, 'siapa-di-baliknya');
  assert.ok(classes.includes('band-paper'), 'the section uses the paper band');
  assert.match(section, /05 · Siapa di baliknya/, 'the numbered kicker is 05');
  assert.match(section, /<h2[^>]*>\s*Riset terbuka, bisa diperiksa siapa pun\s*<\/h2>/);
});

test('the trust section renders four items without images', () => {
  const items = [
    'Peneliti utama',
    'Tim peneliti',
    'Kode terbuka',
    'Data terbuka',
  ];
  for (const label of items) {
    assert.ok(section.includes(label), `renders the "${label}" item`);
  }
  assert.doesNotMatch(section, /<img\b/, 'the section renders no images or logos');
  assert.ok(
    section.includes('University Medical Center Groningen'),
    'the Tim peneliti copy names UMCG',
  );
});

test('the trust strip renders the ethics status verbatim and an about link', () => {
  const ethics = frontMatterValue(read(RESEARCH_PAGE), 'ethics_status');
  assert.ok(ethics, 'the research page declares an ethics_status');

  const ethicsIndex = section.indexOf('Status etik:');
  assert.ok(ethicsIndex >= 0, 'renders the ethics label');
  assert.ok(section.indexOf(ethics) > ethicsIndex, 'the ethics value follows the label verbatim');

  const links = [...section.matchAll(/<a\b[^>]*href=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>/g)].map(
    (match) => ({ href: normalizeHref(match[1]), inner: match[2] }),
  );
  const about = links.find((entry) => entry.href === '/about/');
  assert.ok(about, 'renders a link to /about/');
  assert.match(about.inner, /Tentang gerakan ini/, 'the about link carries its label');
});
