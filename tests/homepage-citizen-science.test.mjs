// Homepage tests that remain valid after the 7-section revamp.
// Removed: T1b-T1c (old hero/citizen_science copy), T4-T9 (old partials),
// T5-T6 (citizen-morph), C1-C3 (scroll/old CSS), V1 (old order), V4 (transparency).
// Kept: auth, nav, privacy page, research app links, dead anchor check.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

let publicHtml = '';
before(async () => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe' });
  publicHtml = read('public/index.html');
});

// ---------------------------------------------------------------- T1 config
test('T1a: params.auth points at the login redirect for /research', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('auth: "https://app.konsulin.care/auth?redirectToPath=/research"'),
    'hugo.yaml must define params.auth',
  );
});

test('T1d: problem/participation blocks are gone', () => {
  const config = read('hugo.yaml');
  assert.ok(!config.includes('home.problem'), 'home.problem must not exist');
  assert.ok(!config.includes('home.participation'), 'home.participation must not exist');
});

test('T1e: no home.problem / home.participation references in config or layouts', () => {
  const config = read('hugo.yaml');
  const index = read('layouts/index.html');
  assert.ok(!config.includes('home.problem'), 'no home.problem in config');
  assert.ok(!index.includes('home.problem'), 'no home.problem in index.html');
});

// ---------------------------------------------------------------- T3 nav
test('T3: nav renders a Login button to params.auth', () => {
  assert.ok(publicHtml.includes('https://app.konsulin.care/auth?redirectToPath=/research'),
    'auth URL must render in the nav');
  assert.ok(publicHtml.includes('>Login</a>'), 'Login button must render');
});

// ---------------------------------------------------------------- T8 privacy page
test('T8a: content/privacy.md stub exists with the required sections', () => {
  assert.ok(exists('content/privacy.md'), 'content/privacy.md must exist');
  const page = read('content/privacy.md');
  assert.ok(page.includes('Kebijakan Privasi & Data'), 'privacy page title must exist');
  assert.ok(page.includes('Data yang dikumpulkan'), 'data collection section must exist');
});

// ---------------------------------------------------------------- V rendered output
test('V3: rendered page links every CTA to the research app', () => {
  const hrefs = [...publicHtml.matchAll(/href=["']?([^"'\s>]+)/g)].map((m) => m[1]);
  assert.ok(hrefs.includes('https://app.konsulin.care/research'), 'forward CTA must render');
  assert.ok(
    hrefs.includes('https://app.konsulin.care/auth?redirectToPath=/research'),
    'auth CTA must render',
  );
  assert.ok(!publicHtml.includes('href="#"'), 'no href="#" anywhere');
});

test('V5: privacy page renders at /privacy', () => {
  assert.ok(exists('public/privacy/index.html'), 'public/privacy/index.html must exist');
  const page = read('public/privacy/index.html');
  assert.ok(page.includes('Kebijakan Privasi & Data'), 'privacy page title rendered');
  assert.ok(page.includes('Data yang dikumpulkan'), 'privacy stub section rendered');
});
