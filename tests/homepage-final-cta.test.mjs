// Final CTA: a content block on the charcoal band (the band is applied by scroll-section.html).
//   FC1  source: paper text on charcoal, no card wrapper, no rail
//   FC2  source and rendered: unnumbered kicker and an on-dark pill CTA to .Site.Params.forward
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let section;

before(() => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe', timeout: 60000 });
  const html = read('public/index.html');
  const start = html.search(/<section\s+id="?final-cta"?/);
  assert.ok(start >= 0, 'rendered final-cta section exists');
  section = html.slice(start, html.indexOf('</section>', start));
});

// ── FC1 source ─────────────────────────────────────────────────────
test('FC1a: final-cta uses text-background for headline and body, never muted-foreground or text-foreground', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.match(partial, /<h2[^>]*text-background/, 'headline uses text-background');
  assert.match(partial, /<p[^>]*text-background/, 'body uses text-background');
  assert.ok(!partial.includes('text-muted-foreground'), 'no text-muted-foreground on charcoal');
  assert.ok(!/<h2[^>]*text-foreground/.test(partial), 'headline must not use text-foreground');
});

test('FC1b: final-cta has no bg-card or bordered card wrapper and no rail grid', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(!partial.includes('bg-card'), 'no bg-card');
  assert.ok(!/\bborder\b/.test(partial.replace(/\{\{[\s\S]*?\}\}/g, '')), 'no border classes');
  assert.ok(!partial.includes('grid-cols-12'), 'no 12-column rail');
});

test('FC1c: final-cta keeps its wrapper and headline scale', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(partial.includes('max-w-6xl mx-auto px-6 py-24 md:px-8'));
  assert.ok(partial.includes('max-w-4xl'));
  assert.ok(partial.includes('text-3xl font-semibold text-background md:text-4xl'));
  assert.ok(partial.includes('leading-6 md:leading-8'));
});

// ── FC2 kicker and CTA ─────────────────────────────────────────────
test('FC2a: final-cta calls section-kicker.html with the final_cta label and no num', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  const call = partial.match(/partial\s+"section-kicker\.html"[^}]*/);
  assert.ok(call, 'calls section-kicker.html');
  assert.ok(call[0].includes('.Site.Params.home.final_cta.kicker'), 'uses the final_cta kicker label');
  assert.ok(!call[0].includes('"num"'), 'passes no number');
});

test('FC2b: final-cta CTA uses button.html with tone on-dark and .Site.Params.forward', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  const call = partial.match(/partial\s+"button\.html"[^}]*/);
  assert.ok(call, 'calls button.html');
  assert.ok(call[0].includes('"tone" "on-dark"'), 'uses the on-dark tone');
  assert.ok(call[0].includes('.Site.Params.forward'), 'links to .Site.Params.forward');
});

test('FC2c: rendered final-cta shows the unnumbered kicker and the on-dark pill', () => {
  assert.ok(/<p class="?[^">]*section-kicker[^>]*>Ikut serta<\/p>/.test(section), 'unnumbered "Ikut serta" kicker');
  assert.ok(!/\d\d · Ikut serta/.test(section), 'kicker has no number');
  assert.ok(section.includes('rounded-full'), 'CTA is a pill');
  assert.ok(section.includes('hover:bg-background'), 'CTA uses the on-dark hover');
});

test('FC2d: kicker stays readable on charcoal (text-background override)', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(partial.includes('section-kicker]:!text-background'), 'kicker colour is overridden to paper');
});
