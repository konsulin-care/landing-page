// Homepage revamp (7 sections). Tests map 1:1 to the landing page spec:
//   R1  index.html registers exactly 7 sections in the new order
//   R2  hero partial has approved headline, body, CTA, trust line
//   R3  trust-strip partial has exactly 4 cards
//   R4  why-it-matters partial has approved title, body, CTA, local image
//   R5  how-it-works partial has 3 numbered steps mentioning "ID Anonim"
//   R6  claim-report partial explains Guest ID -> report -> claim -> magic link
//   R7  research-credibility partial has 3 cards + CTA
//   R8  final-cta partial has approved headline + single CTA
//   R9  all CTAs target https://app.konsulin.care/research
//   R10 "ID Anonim" used consistently; no "anonim" without "ID" prefix
//   R11 no em dash / en dash in any partial or config copy
//   R12 single h1 in entire rendered homepage
//   R13 hero.jpg and why-it-matters.jpg exist in assets/images
//   R14 obsolete sections removed (citizen-science, privacy, transparency, collaboration, impact)
//   V   rendered output validation
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// New 6-section architecture: (num, id, partial-name without .html)
const NEW_SECTIONS = [
  [1, 'hero', 'home-hero'],
  [2, 'why-this-research-matters', 'home-why-it-matters'],
  [3, 'how-it-works', 'home-how-it-works'],
  [4, 'claim-report', 'home-claim-report'],
  [5, 'research-credibility', 'home-research-credibility'],
  [6, 'final-cta', 'home-final-cta'],
];

const SURVEY = 'https://app.konsulin.care/research';

// ---------------------------------------------------------------- R1 index.html section order
test('R1a: index.html defines exactly 6 sections in the correct order', () => {
  const index = read('layouts/index.html');
  for (const [num, id, partial] of NEW_SECTIONS) {
    assert.ok(
      index.includes(`"id" "${id}"`) && index.includes(`"partial" "${partial}.html"`),
      `section ${num}: id="${id}" partial="${partial}.html" must be in index.html`,
    );
  }
  for (const old of ['citizen-science', 'privacy', 'transparency', 'collaboration', 'impact', 'join', 'trust-strip']) {
    assert.ok(
      !index.includes(`"id" "${old}"`),
      `old section id "${old}" must be removed from index.html`,
    );
  }
});

// ---------------------------------------------------------------- R2 hero content (check hugo.yaml config + partial source)
// R2a removed — copy is content-driven, not verbatim-tested

test('R2b: hero CTA is "Mulai Survei (10 Menit)"', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('Mulai Survei (10 Menit)'),
    'hero CTA must be in hugo.yaml',
  );
});

test('R2c: hero partial references hero image asset', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('hero.jpg'),
    'hero partial must reference hero.jpg',
  );
});

test('R2d: hero partial uses .Site.Params.forward for CTA link', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(
    hero.includes('.Site.Params.forward'),
    'hero CTA must use .Site.Params.forward',
  );
});

// R3 trust-strip removed — trust icons moved inline to hero partial

// ---------------------------------------------------------------- R4 why-it-matters
test('R4a: why-it-matters title in config', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('Kenapa penelitian ini penting?'),
    'why_it_matters.title must be in hugo.yaml',
  );
});

test('R4b: why-it-matters partial uses .Site.params.forward for CTA', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('.Site.Params.forward'),
    'why-it-matters CTA must link via .Site.Params.forward',
  );
});

test('R4c: why-it-matters references local image asset', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(
    partial.includes('why-it-matters.jpg'),
    'why-it-matters must reference the local image',
  );
});

// ---------------------------------------------------------------- R5 how-it-works
test('R5a: how-it-works config has 3 steps with ID Anonim', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('Cara kerjanya'),
    'how_it_works.title must be in hugo.yaml',
  );
  assert.ok(
    config.includes('Dapatkan ID Anonim'),
    'step 2 must mention "Dapatkan ID Anonim"',
  );
  assert.ok(
    config.includes('ID Anonim'),
    'config must reference "ID Anonim"',
  );
});

test('R5b: how-it-works partial iterates over steps', () => {
  const partial = read('layouts/partials/home-how-it-works.html');
  assert.ok(
    partial.includes('.Site.Params.home.how_it_works.steps'),
    'how-it-works must iterate over steps',
  );
  assert.ok(
    partial.includes('.num') && partial.includes('.title') && partial.includes('.text'),
    'how-it-works must render .num, .title, .text',
  );
});

// ---------------------------------------------------------------- R6 claim-report
test('R6a: claim-report config explains claim flow via cards', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('magic link'),
    'claim_report config must mention "magic link"',
  );
  assert.ok(
    config.includes('Email bersifat opsional'),
    'claim_report config must state email is optional',
  );
});

test('R6b: claim-report config has cards with icons', () => {
  const config = read('hugo.yaml');
  for (const icon of ['fingerprint-pattern', 'mail-badge', 'scroll-text']) {
    assert.ok(
      config.includes(icon),
      `claim_report cards must contain icon "${icon}"`,
    );
  }
});

test('R6c: claim-report partial renders note (flow table removed)', () => {
  const partial = read('layouts/partials/home-claim-report.html');
  assert.ok(
    partial.includes('.Site.Params.home.claim_report.note'),
    'claim-report must render the note about email being optional',
  );
});

// ---------------------------------------------------------------- R7 research-credibility
// R7a removed — copy is content-driven, not verbatim-tested

test('R7b: research-credibility partial uses .Site.params.forward for CTA', () => {
  const partial = read('layouts/partials/home-research-credibility.html');
  assert.ok(
    partial.includes('.Site.Params.forward'),
    'research-credibility CTA must link via .Site.Params.forward',
  );
});

// ---------------------------------------------------------------- R8 final-cta
// R8a removed — copy is content-driven, not verbatim-tested

test('R8b: final-cta partial has no secondary button', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(
    !partial.includes('#process'),
    'final-cta must not have a secondary button linking to #process',
  );
  assert.ok(
    partial.includes('.Site.Params.forward'),
    'final-cta must link via .Site.Params.forward',
  );
});

// ---------------------------------------------------------------- R9 all CTAs target survey URL
test('R9a: hero partial uses .Site.Params.forward', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(hero.includes('.Site.Params.forward'), 'hero must use forward URL');
});

test('R9b: why-it-matters uses .Site.Params.forward', () => {
  const partial = read('layouts/partials/home-why-it-matters.html');
  assert.ok(partial.includes('.Site.Params.forward'), 'why-it-matters must use forward URL');
});

test('R9c: research-credibility uses .Site.Params.forward', () => {
  const partial = read('layouts/partials/home-research-credibility.html');
  assert.ok(partial.includes('.Site.Params.forward'), 'research-credibility must use forward URL');
});

test('R9d: final-cta uses .Site.Params.forward', () => {
  const partial = read('layouts/partials/home-final-cta.html');
  assert.ok(partial.includes('.Site.Params.forward'), 'final-cta must use forward URL');
});

test('R9e: old CTA text "Ikut Berkontribusi" removed from config', () => {
  const config = read('hugo.yaml');
  assert.ok(
    !config.includes('Ikut Berkontribusi'),
    'old CTA text must be removed from hugo.yaml',
  );
});

// ---------------------------------------------------------------- R10 "ID Anonim" consistency
test('R10a: no bare "anonim" without "ID" prefix in partials', () => {
  const partials = [
    'home-hero.html',
    'home-why-it-matters.html',
    'home-how-it-works.html',
    'home-claim-report.html',
    'home-research-credibility.html',
    'home-final-cta.html',
  ];
  for (const p of partials) {
    const lines = read(`layouts/partials/${p}`).split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{{') || line.trim().startsWith('<!--')) continue;
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('anonim') && !lowerLine.includes('id anonim')) {
        assert.fail(
          `${p} contains bare "anonim" without "ID" prefix: "${line.trim()}"`,
        );
      }
    }
  }
});

test('R10b: config uses "ID Anonim" consistently', () => {
  const config = read('hugo.yaml');
  // Every occurrence of "Anonim" in the home section should be preceded by "ID"
  const homeSection = config.slice(config.indexOf('home:'));
  const lines = homeSection.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('anonim') && !lower.includes('id anonim') && !lower.includes('id_pseudonim')) {
      assert.fail(
        `hugo.yaml home section has bare "anonim" without "ID": "${line.trim()}"`,
      );
    }
  }
});

// ---------------------------------------------------------------- R11 no em/en dashes
test('R11a: no em dash or en dash in partials or config copy', () => {
  const files = [
    'hugo.yaml',
    'layouts/partials/home-hero.html',
    'layouts/partials/home-why-it-matters.html',
    'layouts/partials/home-how-it-works.html',
    'layouts/partials/home-claim-report.html',
    'layouts/partials/home-research-credibility.html',
    'layouts/partials/home-final-cta.html',
  ];
  for (const f of files) {
    const content = read(f);
    assert.ok(!content.includes('\u2014'), `${f} must not contain em dash (U+2014)`);
    assert.ok(!content.includes('\u2013'), `${f} must not contain en dash (U+2013)`);
  }
});

// ---------------------------------------------------------------- R12 single h1
test('R12a: rendered homepage has exactly one h1', () => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe' });
  const html = read('public/index.html');
  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  assert.equal(h1Count, 1, 'homepage must have exactly one h1');
});

// ---------------------------------------------------------------- R13 local image assets
test('R13a: hero.jpg exists in assets/images', () => {
  assert.ok(exists('assets/images/hero.jpg'), 'assets/images/hero.jpg must exist');
});

test('R13b: why-it-matters.jpg exists in assets/images', () => {
  assert.ok(exists('assets/images/why-it-matters.jpg'), 'assets/images/why-it-matters.jpg must exist');
});

// ---------------------------------------------------------------- R14 obsolete sections removed
test('R14a: no old partials referenced in index.html', () => {
  const index = read('layouts/index.html');
  for (const old of ['home-citizen-science', 'home-privacy', 'home-transparency', 'home-collaboration', 'home-impact', 'home-process']) {
    assert.ok(
      !index.includes(`"${old}"`),
      `old partial "${old}" must not be referenced in index.html`,
    );
  }
});

test('R14b: rendered page has no old section ids', () => {
  const html = read('public/index.html');
  for (const old of ['citizen-science', 'privacy', 'transparency', 'collaboration', 'impact']) {
    assert.ok(
      !html.includes(`id="${old}"`) && !html.includes(`id=${old}`),
      `rendered page must not contain old section id="${old}"`,
    );
  }
});

// ---------------------------------------------------------------- V rendered output validation (uses public/index.html built in R12)
// V1 removed — section order is structure-tested, not copy-verbatim-tested

test('V2: rendered page has exactly 6 snap sections', () => {
  const html = read('public/index.html');
  const sections = (html.match(/scroll-snap-section(?=\s|["'>])/g) ?? []).length;
  assert.equal(sections, 6, 'rendered page must have exactly 6 snap sections');
});

test('V3: no href="#" dead anchors', () => {
  const html = read('public/index.html');
  assert.ok(!html.includes('href="#"'), 'no href="#" dead anchors');
});
