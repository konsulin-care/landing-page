// Tone bands: scroll-section.html owns a full-bleed tone per homepage section.
// Expectations are derived from the section dicts registered in layouts/index.html.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

const BAND_CLASSES = {
  paper: ['bg-background'],
  surface: ['bg-card', 'border-y', 'border-border'],
  charcoal: ['bg-foreground', 'text-background'],
};

/** Parses the section dicts registered in layouts/index.html. */
function parseSections() {
  const index = read('layouts/index.html');
  return index
    .split('\n')
    .filter((line) => /\(dict\s+"num"/.test(line))
    .map((line) => ({
      num: Number(line.match(/"num"\s+(\d+)/)?.[1]),
      tone: line.match(/"tone"\s+"([^"]+)"/)?.[1],
      id: line.match(/"id"\s+"([^"]+)"/)?.[1],
      partial: line.match(/"partial"\s+"([^"]+)"/)?.[1],
      key: line.match(/"key"\s+"([^"]+)"/)?.[1],
    }));
}

let html = '';
let sections = [];

/** Returns the class tokens of the rendered <section> with the given id. */
function sectionClasses(id) {
  const re = new RegExp(`<section\\s+[^>]*id="?${id}"?[^>]*?class="?([^">]*)`);
  const match = html.match(re);
  assert.ok(match, `rendered <section id="${id}"> has a class attribute`);
  return match[1].split(/\s+/);
}

before(() => {
  const dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-bands-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  html = read(path.join(dest, 'index.html'));
  sections = parseSections();
});

// ── B1 source ──────────────────────────────────────────────────────
test('B1a: every registered section passes a known tone', () => {
  assert.ok(sections.length > 0, 'index.html registers at least one section');
  for (const section of sections) {
    assert.ok(
      Object.hasOwn(BAND_CLASSES, section.tone),
      `${section.id} must use a known tone, got "${section.tone}"`,
    );
  }
});

// ── B2 rendered ────────────────────────────────────────────────────
test('B2a: each rendered section carries the band classes of its tone', () => {
  for (const section of sections) {
    const classes = sectionClasses(section.id);
    for (const cls of BAND_CLASSES[section.tone]) {
      assert.ok(classes.includes(cls), `${section.id} (${section.tone}) needs ${cls}`);
    }
  }
});

test('B2b: no section uses tint or muted as its background', () => {
  for (const section of sections) {
    const classes = sectionClasses(section.id);
    assert.ok(
      !classes.includes('bg-accent') && !classes.includes('bg-muted'),
      `${section.id} must not use bg-accent or bg-muted`,
    );
  }
});
