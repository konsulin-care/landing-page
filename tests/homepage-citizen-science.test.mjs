// Homepage citizen-science refactor. Tests map 1:1 to the 14-task plan:
//   T1  hugo.yaml: meta alias/description/keywords/forward, no WhatsApp,
//       transparency placeholders, citizen-science copy blocks
//   T2  layouts/index.html: 9 sections in order, no dead scripts
//   T3  assets/js/scroll-navigation.js: DOM-counted sections, no constants
//   T4-T12 partials: structure + param-driven copy (exact copy checked
//       against hugo.yaml and the built page)
//   T13 orphaned partials unreferenced; build renders 9 snap sections
//   T14 docs updated
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ---------------------------------------------------------------- T1 config

test('T1a: meta alias and meta description live in hugo.yaml', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('Konsulin — Riset Kesehatan Bersama Masyarakat'),
    'meta alias must name Riset Kesehatan Bersama Masyarakat',
  );
  assert.ok(
    config.includes(
      'Ikut berkontribusi dalam riset kesehatan bersama masyarakat, peneliti, dan akademisi.',
    ),
    'meta description must match the finalized copy',
  );
});

test('T1b: keywords include citizen-science terms', () => {
  const config = read('hugo.yaml');
  for (const term of [
    'riset kesehatan partisipatif',
    'citizen science',
    'riset kesehatan bersama masyarakat',
  ]) {
    assert.ok(config.includes(term), `keywords must include "${term}"`);
  }
});

test('T1c: forward points to research app, no WhatsApp/formsubmit in config', () => {
  const config = read('hugo.yaml');
  assert.ok(
    config.includes('forward: "https://app.konsulin.care/research"'),
    'forward must point to the research app',
  );
  assert.ok(!config.includes('wa.me'), 'no WhatsApp URLs in hugo.yaml');
  assert.ok(!config.includes('formsubmit.co'), 'no formsubmit in hugo.yaml');
});

test('T1d: old P1-P5 param blocks are gone', () => {
  const config = read('hugo.yaml');
  for (const key of ['p1:', 'p2:', 'p3:', 'p4:', 'p5:']) {
    assert.ok(!config.includes(key), `old "${key}" block must be removed`);
  }
});

test('T1e: transparency placeholders live in site params', () => {
  const config = read('hugo.yaml');
  assert.ok(config.includes('data_count: 12482'), 'data_count placeholder');
  assert.ok(config.includes('types: 5'), 'types placeholder');
  assert.ok(config.includes('contributors: 1836'), 'contributors placeholder');
  assert.ok(config.includes('updated: "Hari ini"') || config.includes('updated: Hari ini'), 'updated placeholder');
});

// ---------------------------------------------------------------- copy blocks in config

const COPY_PHRASES = [
  // Hero
  'Keseharian Anda merupakan bagian penting dari riset kesehatan.',
  'Konsulin menghubungkan masyarakat dengan peneliti untuk menghasilkan pengetahuan kesehatan bersama.',
  'Ikut Berkontribusi',
  'Identitas Anda tidak diberikan kepada peneliti.',
  'Data penelitian menggunakan nomor unik yang dibuat secara acak.',
  'Catat pengalaman Anda.',
  'Ajukan pertanyaan.',
  'Ikut memahami hasilnya.',
  // Problem
  'Riset',
  'Riset kesehatan dimulai dari pertanyaan nyata.',
  'Banyak pertanyaan kesehatan muncul dari pengalaman sehari-hari.',
  'Pertanyaan tersebut layak dipelajari secara ilmiah.',
  'Mengapa kualitas tidur saya berubah?',
  'Apa yang memengaruhi suasana hati?',
  'Bagaimana kebiasaan tertentu memengaruhi kesehatan?',
  'Apa yang dialami orang lain?',
  'Ajukan pertanyaan Anda',
  // Participation
  'Anda bukan hanya sumber data.',
  'Sampaikan hal yang ingin Anda pahami.',
  'Catat kondisi, kebiasaan, atau pengalaman Anda.',
  'Berikan konteks pada temuan dari data bersama.',
  // Process
  'Dari pengalaman menjadi pengetahuan.',
  'Tentukan pertanyaan',
  'Anda dapat mengusulkan pertanyaan atau hipotesis.',
  'Kumpulkan data',
  'Data dikumpulkan sesuai tujuan dan persetujuan Anda.',
  'Pelajari bersama',
  'Peneliti membantu menganalisis data secara ilmiah.',
  'Pahami hasilnya',
  'Anda dapat melihat pola dan temuan dari data bersama.',
  'Lihat cara kerja Konsulin',
  // Transparency
  'Anda bisa melihat apa yang sedang dikumpulkan.',
  'Konsulin menampilkan data agregat tentang proses pengumpulan.',
  'Anda dapat melihat jumlah data dan jenis data yang terkumpul.',
  'Transparansi membantu Anda memahami bagaimana kontribusi Anda digunakan.',
  // Privacy
  'Data Anda tetap berada dalam kendali Anda.',
  'Identitas terlindungi',
  'Nomor unik acak',
  'Anda mengetahui tujuan penggunaan data sebelum menyetujuinya.',
  'Anda dapat menarik persetujuan.',
  'Data yang masih dapat dihapus akan dihapus setelah penarikan persetujuan.',
  'Data yang telah diproses dapat dikecualikan sesuai ketentuan penelitian.',
  'Pelajari kebijakan data',
  // Collaboration
  'Masyarakat dan peneliti membawa keahlian yang berbeda.',
  'Membawa pengalaman, pertanyaan, dan konteks kehidupan nyata.',
  'Membawa metode, analisis, dan pengetahuan ilmiah.',
  'Bersama, keduanya membantu menghasilkan riset yang relevan dengan kehidupan masyarakat.',
  // Impact
  'Temuan',
  'Temuan yang dapat dipakai bersama.',
  'Riset yang baik membantu kita memahami masalah kesehatan dengan lebih baik.',
  'Temuannya dapat menjadi masukan bagi masyarakat, peneliti, dan pembuat kebijakan.',
  'Lihat hasil penelitian',
  // Final CTA
  'Punya pengalaman yang ingin dipahami?',
  'Jadikan pengalaman Anda menjadi bagian dari riset kesehatan.',
  'Pelajari cara kerja Konsulin',
];

test('T1f: citizen-science copy blocks defined in hugo.yaml', () => {
  const config = read('hugo.yaml');
  for (const phrase of COPY_PHRASES) {
    assert.ok(config.includes(phrase), `hugo.yaml must contain: "${phrase}"`);
  }
});

// ---------------------------------------------------------------- T2 skeleton

const SECTION_ORDER = [
  'home-hero',
  'home-problem',
  'home-participation',
  'home-process',
  'home-transparency',
  'home-privacy',
  'home-collaboration',
  'home-impact',
  'home-cta',
];

test('T2: index.html registers exactly the 9 sections in order', () => {
  const index = read('layouts/index.html');
  let prev = -1;
  for (const name of SECTION_ORDER) {
    const at = index.indexOf(`"${name}.html"`);
    assert.ok(at !== -1, `index must register ${name}.html`);
    assert.ok(at > prev, `${name}.html must come after the previous section`);
    prev = at;
  }
  const count = (index.match(/home-[a-z]+\.html/g) ?? []).length;
  assert.equal(count, 9, 'index.html must register exactly 9 section partials');
});

test('T2b: no dead static script refs; carousel assets kept', () => {
  const index = read('layouts/index.html');
  assert.ok(
    !index.includes('js/scroll-navigation.js'),
    'dead /js/scroll-navigation.js reference must go',
  );
  assert.ok(index.includes('css/carousel.css'), 'carousel css kept');
  assert.ok(index.includes('js/carousel.js'), 'carousel js kept');
});

// ---------------------------------------------------------------- T3 snap chrome

test('T3: scroll-navigation counts sections from the DOM, no hardcoded constants', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(
    js.includes("document.querySelectorAll('.scroll-snap-section').length"),
    'totalSections must be derived from the DOM',
  );
  assert.ok(!js.includes('totalSections: 5'), 'no hardcoded totalSections: 5');
  assert.ok(!js.includes('VISION_SECTION'), 'no VISION_SECTION constant');
  assert.ok(!js.includes('TOTAL_FRAMES'), 'no TOTAL_FRAMES constant');
  assert.ok(!js.includes('FRAME_0_BOUNDARY'), 'no FRAME_0_BOUNDARY constant');
});

test('T3b: hero rotator component ships and registers before Alpine', () => {
  const js = read('assets/js/hero-rotator.js');
  assert.ok(js.includes('function heroRotator'), 'hero-rotator.js must define heroRotator()');
  assert.ok(js.includes("Alpine.data('heroRotator'"), 'component must register via Alpine.data');
  assert.ok(js.includes('alpine:init'), 'component must register on alpine:init');
  assert.ok(
    js.includes("querySelectorAll('[data-hero-rotator-item]')"),
    'component must count phrases from the DOM',
  );
  const footer = read('layouts/partials/footer.html');
  const heroRotatorAt = footer.indexOf('hero-rotator.js');
  const alpineAt = footer.indexOf('alpinejs@3');
  assert.notEqual(heroRotatorAt, -1, 'footer must build hero-rotator.js via js.Build');
  assert.ok(heroRotatorAt < alpineAt, 'hero-rotator.js must load before Alpine auto-start');
});

// ---------------------------------------------------------------- T4-T12 partials (structure + params)

const PARTIAL_PARAMS = {
  'home-hero.html': ['Params.home.hero', '<h1', 'heroRotator', 'hidden lg:block'],
  'home-problem.html': ['Params.home.problem', 'micro_cta'],
  'home-participation.html': ['vision-carousel', 'feature-frame', 'text-frame', 'progress-dot', 'chevron'],
  'home-process.html': ['Params.home.process', 'steps'],
  'home-transparency.html': ['Params.home.transparency', 'data_count', 'types', 'contributors', 'updated'],
  'home-privacy.html': ['Params.home.privacy', 'withdrawal'],
  'home-collaboration.html': ['Params.home.collaboration'],
  'home-impact.html': ['Params.home.impact', 'Params.home.impact.cta'],
  'home-cta.html': ['Params.home.cta', 'Params.home.cta_section.primary_cta'],
};

test('T4-T12: each section partial exists and is param-driven with required structure', () => {
  for (const [file, markers] of Object.entries(PARTIAL_PARAMS)) {
    assert.ok(exists(`layouts/partials/${file}`), `${file} must exist`);
    const content = read(`layouts/partials/${file}`);
    for (const marker of markers) {
      assert.ok(content.includes(marker), `${file} must contain: ${marker}`);
    }
  }
});

test('T6b: participation carousel must not link to /feature/ pages', () => {
  const content = read('layouts/partials/home-participation.html');
  assert.ok(!content.includes('/feature/'), 'no href to /feature/ pages');
  assert.ok(!content.includes('RegularPages'), 'no content/feature lookups');
  assert.ok(!content.includes('where'), 'no section queries');
});

test('T12b: final CTA has no email form / formsubmit wiring', () => {
  const cta = read('layouts/partials/home-cta.html');
  assert.ok(!/<\s*form[\s>]/i.test(cta), 'no <form> element in final CTA');
  assert.ok(!cta.includes('formsubmit'), 'no formsubmit wiring in final CTA');
});

test('T4-12c: homepage partials carry no WhatsApp links', () => {
  for (const file of Object.keys(PARTIAL_PARAMS)) {
    if (file === 'home-hero.html' || file === 'home-cta.html') {
      const content = read(`layouts/partials/${file}`);
      assert.ok(!content.includes('wa.me'), `${file} must not link to WhatsApp`);
    }
  }
});

// ---------------------------------------------------------------- T13 orphans + build

const ORPHANED = [
  'home-rationale',
  'home-partners',
  'home-blog',
  'home-feature',
  'home-pricing',
  'home-header',
  'home-vision-mission',
];

test('T13: homepage references no orphaned partials', () => {
  const index = read('layouts/index.html');
  for (const orphan of ORPHANED) {
    assert.ok(!index.includes(orphan), `index.html must not reference ${orphan}`);
  }
});

let publicHtml = '';

before(async () => {
  execFileSync('hugo', ['--minify'], { cwd: ROOT, stdio: 'pipe' });
  publicHtml = read('public/index.html');
});

test('T13b: production build succeeds and renders 9 snap sections', () => {
  // Hugo minifies unquoted single-class attributes (class=scroll-snap-section),
  // so accept both quoted and unquoted, but exclude the __content divs.
  const sections = (publicHtml.match(/class=["']?scroll-snap-section(?=\s|["'>])/g) ?? []).length;
  assert.equal(sections, 9, 'rendered page must have exactly 9 snap sections');
  assert.ok(!publicHtml.includes('formsubmit.co'), 'no formsubmit network call');
  assert.ok(!publicHtml.includes('wa.me'), 'no WhatsApp links on rendered homepage');
});

test('T13c: scroll-navigation ships from Hugo Pipes, not a stale static copy', () => {
  const footer = read('layouts/partials/footer.html');
  assert.ok(
    footer.includes('resources.Get "js/scroll-navigation.js" | js.Build'),
    'footer must build scroll-navigation via js.Build',
  );
  assert.ok(
    !exists('static/js/scroll-navigation.js'),
    'no stale static copy of scroll-navigation.js',
  );
});

// ---------------------------------------------------------------- T14 docs

test('T14a: CTA_STRATEGY.md documents research-first hierarchy', () => {
  const doc = read('docs/CTA_STRATEGY.md');
  assert.ok(doc.includes('research'), 'CTA strategy doc must mention research');
  assert.ok(
    doc.includes('Ikut Berkontribusi') || doc.includes('app.konsulin.care/research'),
    'CTA strategy doc must cover the new primary CTA',
  );
});

test('T14b: LANDING_PAGE_FORMULA.md reflects the new 9-section structure', () => {
  const doc = read('docs/LANDING_PAGE_FORMULA.md');
  assert.ok(doc.includes('home-hero') || doc.includes('home-problem'), 'doc must reference new sections');
  assert.ok(
    doc.includes('participation') || doc.includes('Anda bukan hanya sumber data'),
    'doc must reflect the Participation section',
  );
  assert.ok(
    !doc.includes('home-rationale'),
    'doc must not present the marquee as a homepage section',
  );
});

// ---------------------------------------------------------------- whole-change verification (final step mirror)

test('V1: rendered section order matches the plan', () => {
  const order = [
    'Keseharian Anda merupakan bagian penting dari riset kesehatan.',
    'Riset kesehatan dimulai dari pertanyaan nyata.',
    'Anda bukan hanya sumber data.',
    'Dari pengalaman menjadi pengetahuan.',
    'Anda bisa melihat apa yang sedang dikumpulkan.',
    'Data Anda tetap berada dalam kendali Anda.',
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

test('V2: rendered transparency dashboard shows the static placeholders', () => {
  assert.ok(publicHtml.includes('12482'), 'data count 12482 rendered');
  assert.ok(publicHtml.includes('1836'), 'contributors 1836 rendered');
  assert.ok(publicHtml.includes('Hari ini'), '"Hari ini" rendered');
});

// ---------------------------------------------------------------- T15 Tailwind build pipeline

const REQUIRED_CSS_CLASSES = [
  'col-span-7',
  'col-span-5',
  'w-8',
  'h-8',
  'rounded-xl',
  'py-20',
];

test('B1: watch/build scripts route Tailwind v4 through postcss-cli', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(
    pkg.scripts['watch:tw'].startsWith('postcss ') &&
      pkg.scripts['watch:tw'].includes('--watch'),
    'watch:tw must invoke postcss-cli in watch mode',
  );
  assert.ok(
    typeof pkg.scripts['build:tw'] === 'string' &&
      pkg.scripts['build:tw'].startsWith('postcss '),
    'build:tw must exist and invoke postcss-cli',
  );
  assert.ok(
    pkg.scripts.build.includes('build:tw'),
    'build must regenerate CSS before running hugo',
  );
});

test('B2: main.css imports Tailwind v4 instead of legacy v3 directives', () => {
  const main = read('assets/css/main.css');
  assert.ok(main.includes('@import "tailwindcss"'), 'main.css must use the v4 native import');
  assert.ok(!main.includes('@tailwind base'), 'legacy @tailwind base directive must be gone');
  assert.ok(!main.includes('@tailwind components'), 'legacy @tailwind components directive must be gone');
  assert.ok(!main.includes('@tailwind utilities'), 'legacy @tailwind utilities directive must be gone');
});

test('B3: compiled assets/css/style.css contains every homepage utility class', () => {
  const css = read('assets/css/style.css');
  for (const cls of REQUIRED_CSS_CLASSES) {
    assert.ok(css.includes(`.${cls}`), `assets/css/style.css must contain .${cls}`);
  }
});

test('B4: main.css migrates the legacy config into v4-native @theme', () => {
  const main = read('assets/css/main.css');
  assert.ok(main.includes('@theme'), 'main.css must define a v4 @theme block');
  assert.ok(main.includes('--color-primary-600'), '@theme must define --color-primary-600');
  assert.ok(main.includes('--color-primary:'), '@theme must define the bare --color-primary');
  assert.ok(main.includes('--color-gray-200'), '@theme must define the custom gray-200');
  assert.ok(
    main.includes('@custom-variant dark'),
    'main.css must restore class-based dark mode via @custom-variant',
  );
  assert.ok(
    main.includes('@plugin "@tailwindcss/typography"'),
    'main.css must load the typography plugin for prose pages',
  );
});

test('B5: compiled CSS restores the primary palette and the hero-only slide', () => {
  const css = read('assets/css/style.css');
  assert.ok(css.includes('.bg-primary-600'), 'compiled css must contain .bg-primary-600 (CTA buttons)');
  assert.ok(css.includes('.text-primary-800'), 'compiled css must contain .text-primary-800 (AA accents)');
  assert.ok(css.includes('.scroll-snap-section--slide'), 'compiled css must contain the hero slide modifier');
  assert.ok(css.includes('calc(100svh - 64px)'), 'hero slide must fit the visible area below the header');
  assert.ok(css.includes('overscroll-behavior: none'), 'html must disable overscroll chaining');
});

test('B6: legacy tailwind.config.js is removed after the @theme migration', () => {
  assert.ok(!exists('tailwind.config.js'), 'tailwind.config.js must be deleted after migration');
});

test('B7: scroll-navigation has no snap/touch/share machinery (natural scroll)', () => {
  const js = read('assets/js/scroll-navigation.js');
  for (const gone of [
    'isSlideMode',
    'matchMedia',
    'touchstart',
    'touchmove',
    'touchend',
    'TOUCH_THRESHOLD',
    'copySectionLink',
    'handleScroll',
  ]) {
    assert.ok(!js.includes(gone), `scroll-navigation must not contain: ${gone}`);
  }
});

test('B8: legacy v3-only classes are cleaned up', () => {
  const cta = read('layouts/partials/home-cta.html');
  const nav = read('layouts/partials/nav.html');
  assert.ok(!cta.includes('text-opacity-40'), 'home-cta must not use legacy text-opacity-40');
  assert.ok(cta.includes('text-primary-600/40'), 'home-cta must use v4 opacity syntax');
  assert.ok(!nav.includes('shadow-outline'), 'nav must not use legacy shadow-outline');
  assert.ok(!nav.includes('max-w-5'), 'nav must not carry the junk max-w-5 class');
  assert.ok(!nav.includes('xs:hidden'), 'nav must not carry the junk xs:hidden class');
});

test('B9: accent text on light backgrounds uses AA-passing text-primary-800', () => {
  for (const file of [
    'home-problem.html',
    'home-participation.html',
    'home-process.html',
    'home-transparency.html',
    'home-privacy.html',
    'home-collaboration.html',
    'home-impact.html',
  ]) {
    const content = read(`layouts/partials/${file}`);
    assert.ok(
      content.includes('text-primary-800'),
      `${file} must use text-primary-800 for light-mode accents`,
    );
    assert.ok(
      content.includes('dark:text-primary-200'),
      `${file} must pair text-primary-800 with dark:text-primary-200`,
    );
  }
});

test('B11: card grids go 2-up on mobile so slides can fit narrow screens', () => {
  const problem = read('layouts/partials/home-problem.html');
  const process = read('layouts/partials/home-process.html');
  const transparency = read('layouts/partials/home-transparency.html');
  const privacy = read('layouts/partials/home-privacy.html');
  for (const [file, content] of [
    ['home-problem.html', problem],
    ['home-process.html', process],
    ['home-transparency.html', transparency],
    ['home-privacy.html', privacy],
  ]) {
    assert.ok(
      content.includes('grid-cols-2'),
      `${file} must use a 2-column grid as the mobile base`,
    );
  }
});

test('B12: hero is an exact-fit slide; other sections flow naturally', () => {
  const main = read('assets/css/main.css');
  const slideAt = main.indexOf('.scroll-snap-section--slide');
  assert.notEqual(slideAt, -1, 'slide modifier must exist for the hero');
  assert.ok(
    main.includes('height: calc(100svh - 64px)'),
    'slide must fit the visible area below the header',
  );
  assert.ok(
    main.includes('.scroll-snap-section--slide .scroll-snap-section__content'),
    'slide content must be flex-centered',
  );
  // Between the base rule and the slide modifier there must be no height,
  // min-height, or header padding — flow sections keep natural height.
  const baseStart = main.indexOf('.scroll-snap-section');
  const baseBlock = main.slice(baseStart, slideAt);
  assert.ok(!baseBlock.includes('min-height'), 'flow sections must not force min-height');
  assert.ok(!baseBlock.includes('height:'), 'flow sections must not force a height');
  assert.ok(!baseBlock.includes('padding-top'), 'flow sections must not add header padding');
  assert.ok(
    !main.includes('@media (min-width: 768px)'),
    'no md+ media query: the slide behavior is uniform',
  );
});

test('B13: scroll-navigation keeps observer + scrollToSection, drops auto-snap', () => {
  const js = read('assets/js/scroll-navigation.js');
  assert.ok(js.includes('initIntersectionObserver'), 'intersection observer must remain');
  assert.ok(js.includes('scrollToSection('), 'chevron/keyboard navigation must remain');
  assert.ok(js.includes('history.replaceState'), 'hash sync must remain');
  assert.ok(!js.includes('isSlideMode'), 'no slide-mode gating');
  assert.ok(!js.includes('handleScroll'), 'no auto-snap on scroll');
});

test('B14: component scripts must load before Alpine so registration precedes start', () => {
  const footer = read('layouts/partials/footer.html');
  const scrollNavAt = footer.indexOf('scroll-navigation.js');
  const alpineAt = footer.indexOf('alpinejs@3');
  assert.notEqual(scrollNavAt, -1, 'scroll-navigation js.Build tag must exist in footer');
  assert.notEqual(alpineAt, -1, 'Alpine CDN tag must exist in footer');
  assert.ok(
    scrollNavAt < alpineAt,
    'scroll-navigation.js must load before Alpine: the CDN auto-starts on a microtask, so a component script loaded after it registers too late and scrollNavigation stays undefined',
  );
});

test('T5: scroll indicator partial accepts an optional hero-only label', () => {
  const partial = read('layouts/partials/scroll-indicator.html');
  assert.ok(partial.includes('labelVisible'), 'partial must accept a labelVisible expression');
  assert.ok(partial.includes('default "true"'), 'partial must default optional expressions');
  assert.ok(!partial.includes('rounded-full'), 'plain chevrons must have no circle styling');
  const index = read('layouts/index.html');
  assert.ok(index.includes('partial "scroll-indicator.html"'), 'index must use the scroll-indicator partial');
  assert.ok(!index.includes('scroll-indicator fixed'), 'index must not inline chevron markup');
  assert.ok(publicHtml.includes('CARA KERJANYA'), 'rendered page must show the scroll label');
  assert.ok(
    publicHtml.includes('x-show="currentSection === 1"'),
    'down chevron label must render only on the hero section',
  );
});

test('T6: scroll indicator CSS drops the pill/circle styling', () => {
  const main = read('assets/css/main.css');
  const blockStart = main.indexOf('.scroll-indicator');
  const blockEnd = main.indexOf('/* Hero section animations */');
  assert.notEqual(blockStart, -1, '.scroll-indicator block must exist');
  const block = main.slice(blockStart, blockEnd);
  assert.ok(!block.includes('box-shadow'), 'plain chevron must not cast a shadow');
  assert.ok(!block.includes('border-radius'), 'plain chevron must not be a circle/pill');
  assert.ok(block.includes('transparent'), 'chevron button must be transparent');
});

test('B10: mobile vertical rhythm is trimmed so the hero fits and flow sections breathe', () => {
  const squeezes = {
    'home-hero.html': ['py-6 mx-auto sm:py-12'],
    'home-problem.html': ['py-6 mx-auto sm:py-12'],
    'home-participation.html': ['lg:pt-10', 'min-h-36'],
    'home-process.html': ['py-6 mx-auto sm:py-12'],
    'home-transparency.html': ['py-6 mx-auto sm:py-12', 'mt-6'],
    'home-privacy.html': ['py-6 mx-auto sm:py-12', 'sm:mt-8 sm:p-6'],
    'home-collaboration.html': ['py-6 mx-auto sm:py-12'],
    'home-impact.html': ['py-6 mx-auto sm:py-12'],
    'home-cta.html': ['relative pb-8 mt-6', 'sm:py-14'],
  };
  for (const [file, markers] of Object.entries(squeezes)) {
    const content = read(`layouts/partials/${file}`);
    for (const marker of markers) {
      assert.ok(content.includes(marker), `${file} must contain: ${marker}`);
    }
  }
});