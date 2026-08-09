// Homepage conversion refactor (8 sections). Tests map 1:1 to the plan:
//   T1  hugo.yaml: params.auth, focused hero copy, citizen_science frames,
//       kickers, unified "Ikut Berkontribusi" CTAs; problem/participation/
//       rotating/scroll_label removed
//   T2  layouts/index.html: 8 sections (covered in section-anchors.test.mjs)
//   T3  nav.html: "Login" button -> params.auth
//   T4  home-hero.html: centered single-column, chevron to #citizen-science
//   T5  home-citizen-science.html: stage, aria-live, quiet CTA, #hero chevron
//   T6  assets/js/citizen-morph.js: canvas morph, fonts gate, reduced-motion,
//       theme/resize re-render, aria-live announce
//   T7  home-privacy.html: symmetric grid, /privacy link, no href="#"
//   T8  content/privacy.md renders at /privacy
//   T9  compact transparency/process/collaboration/impact/cta sections
//   V   rendered output + CSS verification
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ---------------------------------------------------------------- T1 config

test('T1a: params.auth points at the login redirect for /research', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('auth: "https://app.konsulin.care/auth?redirectToPath=/research"'),
    'hugo.yaml must define params.auth',
  );
});

test('T1b: hero is a focused single-proposition block', () => {
  const config = read('hugo.yaml');
  for (const phrase of [
    'Jadi bagian dari riset kesehatan.',
    'Bagikan pengalaman Anda dan bantu menghasilkan pengetahuan kesehatan bersama.',
    'Ikut Berkontribusi',
    'Identitas Anda tidak diberikan kepada peneliti.',
  ]) {
    assert.ok(config.includes(phrase), `hugo.yaml must contain: "${phrase}"`);
  }
  // One trust line only; rotating phrases and the scroll label are gone.
  assert.ok(!config.includes('rotating:'), 'no rotating phrases');
  assert.ok(!config.includes('scroll_label'), 'no scroll label');
  assert.ok(!config.includes('CARA KERJANYA'), 'no scroll label copy');
});

test('T1c: citizen_science config block defines the three frames', () => {
  const config = read('hugo.yaml');
  for (const phrase of [
    'Partisipasi warga',
    'Ikut ambil bagian dalam riset.',
    'Ceritakan.',
    'Bagikan pengalaman kesehatan Anda.',
    'Tanyakan.',
    'Ajukan pertanyaan yang ingin Anda pahami.',
    'Pahami.',
    'Ikuti hasil penelitian yang Anda bantu.',
  ]) {
    assert.ok(config.includes(phrase), `hugo.yaml must contain: "${phrase}"`);
  }
});

test('T1d: problem/participation blocks are gone', () => {
  const config = read('hugo.yaml');
  assert.ok(!config.includes('problem:'), 'no problem block');
  assert.ok(!config.includes('participation:'), 'no participation block');
  assert.ok(!config.includes('micro_cta'), 'no micro_cta');
  assert.ok(!config.includes('questions:'), 'no example questions');
  for (const phrase of [
    'Riset kesehatan dimulai dari pertanyaan nyata.',
    'Anda bukan hanya sumber data.',
  ]) {
    assert.ok(!config.includes(phrase), `old copy must be gone: "${phrase}"`);
  }
});

test('T1e: no home.problem / home.participation references in config or layouts', () => {
  const check = (rel) => {
    const content = read(rel);
    assert.ok(!content.includes('home.problem'), `${rel} must not reference home.problem`);
    assert.ok(!content.includes('home.participation'), `${rel} must not reference home.participation`);
  };
  check('hugo.yaml');
  check('layouts/index.html');
});

test('T1f: kickers defined for the labeled sections', () => {
  const config = read('hugo.yaml');
  for (const kicker of [
    'Privasi',
    'Transparansi',
    'Proses',
    'Kolaborasi',
    'Dampak',
    'Bergabung',
  ]) {
    assert.ok(config.includes(`kicker: "${kicker}"`), `config must set kicker "${kicker}"`);
  }
});

test('T1g: process/impact CTAs unified to Ikut Berkontribusi, forward unchanged', () => {
  const config = read('hugo.yaml');
  assert.ok(config.includes('forward: "https://app.konsulin.care/research"'), 'forward unchanged');
  assert.ok(
    config.includes('Lihat cara kerja Konsulin') === false,
    'process CTA label must not promise informational content',
  );
  const processBlock = config.slice(config.indexOf('process:'));
  assert.ok(processBlock.includes('cta: "Ikut Berkontribusi"'), 'process.cta unified');
  const impactBlock = config.slice(config.indexOf('impact:'));
  assert.ok(impactBlock.includes('cta: "Ikut Berkontribusi"'), 'impact.cta unified');
});

// ---------------------------------------------------------------- T3 nav login

test('T3: nav renders a Login button to params.auth', () => {
  const nav = read('layouts/partials/nav.html');
  assert.ok(nav.includes('Login'), 'nav must render a Login button');
  assert.ok(nav.includes('Params.auth'), 'nav must link to params.auth');
});

// ---------------------------------------------------------------- T4-T9 partials

const PARTIAL_PARAMS = {
  'home-hero.html': [
    'Params.home.hero',
    'text-center',
    'max-w-3xl',
    '#citizen-science',
    'Params.forward',
  ],
  'home-citizen-science.html': [
    'Params.home.citizen_science',
    'frames',
    'aria-live',
    'role="status"',
    'Params.forward',
    '#hero',
    'cs-morph',
  ],
  'home-privacy.html': [
    'Params.home.privacy',
    'grid-cols-1',
    'sm:grid-cols-3',
    '"privacy" | relURL',
    'kicker',
  ],
  'home-transparency.html': [
    'Params.home.transparency',
    'p-4',
    'text-xs',
    'text-3xl',
    'kicker',
  ],
  'home-process.html': [
    'Params.home.process',
    'p-5',
    'Params.home.process.cta',
    'kicker',
  ],
  'home-collaboration.html': ['Params.home.collaboration', 'kicker'],
  'home-impact.html': ['Params.home.impact', 'Params.home.impact.cta', 'kicker'],
  'home-cta.html': ['Params.home.cta_section', 'href="#process"', 'kicker'],
};

test('T4-T9: each section partial exists with required structure', () => {
  for (const [file, markers] of Object.entries(PARTIAL_PARAMS)) {
    assert.ok(exists(`layouts/partials/${file}`), `${file} must exist`);
    const content = read(`layouts/partials/${file}`);
    for (const marker of markers) {
      assert.ok(content.includes(marker), `${file} must contain: ${marker}`);
    }
  }
});

test('T7b: privacy section has no dead href="#"', () => {
  const privacy = read('layouts/partials/home-privacy.html');
  assert.ok(!privacy.includes('href="#"'), 'no dead privacy link');
});

test('T5b: hero carries no rotating-phrase machinery', () => {
  const hero = read('layouts/partials/home-hero.html');
  assert.ok(!hero.includes('heroRotator'), 'no hero rotator component');
  assert.ok(!hero.includes('rotating'), 'no rotating phrases');
});

test('T6b: citizen-science partial renders phrases from config', () => {
  const partial = read('layouts/partials/home-citizen-science.html');
  assert.ok(partial.includes('range .Site.Params.home.citizen_science.frames'), 'must loop frames');
  assert.ok(partial.includes('data-cs-phrase'), 'phrases must be exposed to the morph script');
  assert.ok(partial.includes('data-cs-live'), 'aria-live region must have a DOM hook');
});

// ---------------------------------------------------------------- T6 morph JS

test('T6c: citizen-morph.js ships with the required behaviors', () => {
  assert.ok(exists('assets/js/citizen-morph.js'), 'citizen-morph.js must exist');
  const js = read('assets/js/citizen-morph.js');
  for (const marker of [
    'document.fonts.ready',
    'prefers-reduced-motion',
    'matchMedia',
    'getComputedStyle',
    'resize',
    'data-cs-live',
  ]) {
    assert.ok(js.includes(marker), `citizen-morph.js must use: ${marker}`);
  }
  assert.ok(!js.includes('setInterval'), 'morph must not rely on setInterval for the loop');
});

test('T6d: footer builds citizen-morph.js via Hugo Pipes before Alpine', () => {
  const footer = read('layouts/partials/footer.html');
  const morphAt = footer.indexOf('resources.Get "js/citizen-morph.js" | js.Build');
  const alpineAt = footer.indexOf('alpinejs@3');
  assert.notEqual(morphAt, -1, 'footer must build citizen-morph.js via js.Build');
  assert.notEqual(alpineAt, -1, 'footer must load Alpine');
  assert.ok(morphAt < alpineAt, 'citizen-morph.js must load before Alpine');
});

// ---------------------------------------------------------------- T8 privacy page

test('T8a: content/privacy.md stub exists with the required sections', () => {
  const page = read('content/privacy.md');
  assert.ok(page.includes('title: "Kebijakan Privasi & Data"'), 'title frontmatter');
  for (const heading of ['Data yang dikumpulkan', 'Tujuan penggunaan', 'Hak Anda', 'Kontak']) {
    assert.ok(page.includes(heading), `privacy.md must include: ${heading}`);
  }
});

// ---------------------------------------------------------------- CSS

test('C1: hero slide grows naturally and the page smooth-scrolls', () => {
  const main = read('assets/css/main.css');
  assert.ok(main.includes('min-height: calc(100svh - 64px)'), 'hero must use min-height');
  const slideStart = main.indexOf('.scroll-snap-section--slide {');
  const slideEnd = main.indexOf('}', slideStart);
  const slideBlock = main.slice(slideStart, slideEnd);
  assert.ok(!slideBlock.includes('overflow'), 'hero slide must not clip content');
  assert.ok(main.includes('scroll-behavior: smooth'), 'html must smooth-scroll');
});

test('C2: section kicker style exists', () => {
  const main = read('assets/css/main.css');
  assert.ok(main.includes('.section-kicker'), 'main.css must define .section-kicker');
  const css = read('assets/css/style.css');
  assert.ok(css.includes('.section-kicker'), 'compiled css must contain .section-kicker');
});

test('C3: morph stage has a reduced-motion static fallback', () => {
  const main = read('assets/css/main.css');
  assert.ok(main.includes('.cs-morph-canvas'), 'canvas class defined');
  assert.ok(main.includes('.cs-morph-static'), 'static fallback class defined');
  assert.ok(main.includes('prefers-reduced-motion'), 'reduced-motion media query present');
});

// ---------------------------------------------------------------- V rendered output

let publicHtml = '';

before(async () => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe' });
  publicHtml = read('public/index.html');
});

test('V1: rendered section order matches the plan', () => {
  const order = [
    'Jadi bagian dari riset kesehatan.',
    'Ikut ambil bagian dalam riset.',
    'Data Anda tetap berada dalam kendali Anda.',
    'Anda bisa melihat apa yang sedang dikumpulkan.',
    'Dari pengalaman menjadi pengetahuan.',
    'Masyarakat dan peneliti membawa keahlian yang berbeda.',
    'Temuan yang dapat dipakai bersama.',
    'Punya pengalaman yang ingin dipahami?',
  ];
  let prev = -1;
  for (const phrase of order) {
    const at = publicHtml.indexOf(phrase);
    assert.notEqual(at, -1, `rendered page must contain: ${phrase}`);
    assert.ok(at > prev, `"${phrase}" must appear after the previous section`);
    prev = at;
  }
});

test('V2: rendered nav shows Login linking to the auth URL', () => {
  assert.ok(
    publicHtml.includes('https://app.konsulin.care/auth?redirectToPath=/research'),
    'auth URL must render in the nav',
  );
  assert.ok(publicHtml.includes('>Login</a>'), 'Login button must render');
});

test('V3: rendered page links every CTA to the research app', () => {
  // Hugo minifies attribute quoting, so collect hrefs in both forms.
  const hrefs = [...publicHtml.matchAll(/href=["']?([^"'\s>]+)/g)].map((m) => m[1]);
  assert.ok(hrefs.includes('https://app.konsulin.care/research'), 'forward CTA must render');
  assert.ok(
    hrefs.includes('https://app.konsulin.care/auth?redirectToPath=/research'),
    'auth CTA must render',
  );
  // No dead anchors remain.
  assert.ok(!publicHtml.includes('href="#"'), 'no href="#" anywhere');
});

test('V4: transparency placeholders still render', () => {
  assert.ok(publicHtml.includes('12482'), 'data count 12482 rendered');
  assert.ok(publicHtml.includes('1836'), 'contributors 1836 rendered');
  assert.ok(publicHtml.includes('Hari ini'), '"Hari ini" rendered');
});

test('V5: privacy page renders at /privacy', () => {
  assert.ok(exists('public/privacy/index.html'), 'public/privacy/index.html must exist');
  const page = read('public/privacy/index.html');
  assert.ok(page.includes('Kebijakan Privasi & Data'), 'privacy page title rendered');
  assert.ok(page.includes('Data yang dikumpulkan'), 'privacy stub section rendered');
});
