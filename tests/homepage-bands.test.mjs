// Tone bands: scroll-section.html owns a full-bleed tone per homepage section.
//   B1  index.html passes a tone per section
//   B2  rendered sections carry the band classes
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const TONES = {
  hero: 'paper',
  'why-this-research-matters': 'surface',
  'how-it-works': 'paper',
  'claim-report': 'surface',
  'research-credibility': 'paper',
  'final-cta': 'charcoal',
};

const BAND_CLASSES = {
  paper: ['bg-background'],
  surface: ['bg-card', 'border-y', 'border-border'],
  charcoal: ['bg-foreground', 'text-background'],
};

let html;

/** Returns the class tokens of the rendered <section> with the given id. */
function sectionClasses(id) {
  const re = new RegExp(`<section\\s+id="?${id}"?[^>]*?class="?([^">]*)`);
  const match = html.match(re);
  assert.ok(match, `rendered <section id="${id}"> has a class attribute`);
  return match[1].split(/\s+/);
}

before(() => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe', timeout: 60000 });
  html = read('public/index.html');
});

// ── B1 source ──────────────────────────────────────────────────────
test('B1a: index.html passes a tone for each section', () => {
  const index = read('layouts/index.html');
  for (const [id, tone] of Object.entries(TONES)) {
    const line = index.split('\n').find((l) => l.includes(`"id" "${id}"`));
    assert.ok(line, `index.html has a dict for ${id}`);
    assert.ok(line.includes(`"tone" "${tone}"`), `${id} must use tone "${tone}"`);
  }
});

// ── B2 rendered ────────────────────────────────────────────────────
test('B2a: hero, how-it-works and research-credibility carry bg-background', () => {
  for (const id of ['hero', 'how-it-works', 'research-credibility']) {
    const classes = sectionClasses(id);
    for (const c of BAND_CLASSES.paper) assert.ok(classes.includes(c), `${id} needs ${c}`);
    assert.ok(!classes.includes('bg-card'), `${id} must not be a surface band`);
  }
});

test('B2b: why-this-research-matters and claim-report carry bg-card border-y border-border', () => {
  for (const id of ['why-this-research-matters', 'claim-report']) {
    const classes = sectionClasses(id);
    for (const c of BAND_CLASSES.surface) assert.ok(classes.includes(c), `${id} needs ${c}`);
  }
});

test('B2c: final-cta carries bg-foreground text-background', () => {
  const classes = sectionClasses('final-cta');
  for (const c of BAND_CLASSES.charcoal) assert.ok(classes.includes(c), `final-cta needs ${c}`);
});

test('B2d: no section uses tint or muted as its background', () => {
  for (const id of Object.keys(TONES)) {
    const classes = sectionClasses(id);
    assert.ok(!classes.includes('bg-accent') && !classes.includes('bg-muted'), `${id} must not use bg-accent or bg-muted`);
  }
});
