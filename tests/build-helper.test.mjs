import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, readBuilt, ROOT } from './helpers/build.mjs';
import { read, parseSections, sectionHtml, sectionClasses } from './helpers/html.mjs';

test('buildSite caches one build per test run', () => {
  const first = buildSite();
  const resultFile = path.join(first.dest, '.build-result.json');
  const before = fs.statSync(resultFile, { bigint: true }).mtimeNs;
  const second = buildSite();
  const after = fs.statSync(resultFile, { bigint: true }).mtimeNs;

  assert.equal(second.dest, first.dest, 'both calls share the same destination');
  assert.equal(second.status, first.status, 'both calls report the same status');
  assert.equal(second.output, first.output, 'both calls report the same output');
  assert.equal(after, before, 'a second call does not rewrite the build result or rerun Hugo');
});

test('buildSite builds outside the repository and records a successful result', () => {
  const { dest, status, output } = buildSite();

  assert.ok(
    !dest.startsWith(`${ROOT}${path.sep}`),
    `build destination must be outside the repository, got ${dest}`,
  );
  assert.equal(status, 0, output);
  assert.equal(typeof output, 'string');

  const record = JSON.parse(fs.readFileSync(path.join(dest, '.build-result.json'), 'utf8'));
  assert.deepEqual(record, { status, output }, 'the recorded result matches the returned result');
});

test('readBuilt reads files from the shared build destination', () => {
  const html = readBuilt('index.html');
  assert.ok(html.length > 0, 'index.html is present in the build');
  assert.ok(html.includes('<html'), 'index.html contains rendered markup');
});

test('parseSections returns the layouts/index.html registry entries', () => {
  const index = read('layouts/index.html');
  const sourceLines = index.split('\n').filter((line) => /\(dict\s+"num"/.test(line));
  const sections = parseSections();

  assert.equal(sections.length, sourceLines.length, 'one entry per registry line');
  assert.ok(sections.length > 0, 'the homepage registers at least one section');

  for (const section of sections) {
    assert.ok(Number.isInteger(section.num), `${section.id} has an integer num`);
    assert.ok(section.tone, `${section.id} has a tone`);
    assert.ok(section.id, `${section.id} has an id`);
    assert.ok(section.partial?.endsWith('.html'), `${section.id} has a partial template`);
  }

  assert.equal(sections[0].id, 'hero', 'the registry starts with the hero section');
  assert.equal(sections.at(-1).id, 'final-cta', 'the registry ends with the final CTA section');
});

test('sectionHtml returns only the requested section markup', () => {
  const html = readBuilt('index.html');
  const sections = parseSections();
  const [first, second] = sections;

  const markup = sectionHtml(html, first.id);
  assert.ok(markup.startsWith('<section'), 'markup starts at the section opening tag');
  assert.ok(markup.endsWith('</section>'), 'markup ends at the section closing tag');
  assert.ok(markup.includes(first.id), 'markup belongs to the requested section');
  assert.equal(
    markup.indexOf('<section', 1),
    -1,
    'markup does not spill into the next section',
  );
  assert.ok(!markup.includes(`id="${second.id}"`) && !markup.includes(`id=${second.id}`), 'markup only carries the requested section id');
  assert.throws(() => sectionHtml(html, 'not-a-real-section-id'), /missing rendered/);
});

test('sectionClasses returns class tokens for the requested section', () => {
  const html = readBuilt('index.html');
  const section = parseSections()[0];
  const classes = sectionClasses(html, section.id);

  assert.ok(Array.isArray(classes), 'classes are returned as tokens');
  assert.ok(classes.includes('home-section'), `${section.id} carries the home-section class`);
});
