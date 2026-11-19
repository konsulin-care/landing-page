import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { parseSections, sectionClasses, sectionHtml } from './helpers/html.mjs';

let html = '';
let sections = [];

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  html = readBuilt('index.html');
  sections = parseSections();
});

test('each registered section renders as a semantic <section> with its id', () => {
  for (const section of sections) {
    const markup = sectionHtml(html, section.id);
    assert.ok(markup.startsWith('<section'), `${section.id} renders a <section> element`);
  }
});

test('registered section ids are unique and their numbers ascend', () => {
  const ids = sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, 'section ids must be unique');

  const nums = sections.map((section) => section.num);
  const sorted = [...nums].sort((a, b) => a - b);
  assert.deepEqual(nums, sorted, 'section nums must ascend');
});

test('each registered section renders exactly once with class home-section', () => {
  for (const section of sections) {
    assert.ok(
      sectionClasses(html, section.id).includes('home-section'),
      `${section.id} carries home-section`,
    );
  }

  const matches = html.match(/\bhome-section\b/g) ?? [];
  assert.equal(
    matches.length,
    sections.length,
    'rendered home-section count must equal registered section count',
  );
});
