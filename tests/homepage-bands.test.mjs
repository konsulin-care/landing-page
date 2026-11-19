import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { parseSections, sectionClasses } from './helpers/html.mjs';

const BAND_CLASSES = {
  paper: ['band-paper'],
  surface: ['band-surface', 'border-y', 'border-border'],
  charcoal: ['bg-foreground', 'text-background'],
};

let html = '';
let sections = [];

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  html = readBuilt('index.html');
  sections = parseSections();
});

test('every registered section passes a known tone', () => {
  assert.ok(sections.length > 0, 'index.html registers at least one section');
  for (const section of sections) {
    assert.ok(
      Object.hasOwn(BAND_CLASSES, section.tone),
      `${section.id} must use a known tone, got "${section.tone}"`,
    );
  }
});

test('each rendered section carries the band classes of its tone', () => {
  for (const section of sections) {
    const classes = sectionClasses(html, section.id);
    for (const cls of BAND_CLASSES[section.tone]) {
      assert.ok(classes.includes(cls), `${section.id} (${section.tone}) needs ${cls}`);
    }
  }
});

test('no section uses tint or muted as its background', () => {
  for (const section of sections) {
    const classes = sectionClasses(html, section.id);
    assert.ok(
      !classes.includes('bg-accent') && !classes.includes('bg-muted'),
      `${section.id} must not use bg-accent or bg-muted`,
    );
  }
});
