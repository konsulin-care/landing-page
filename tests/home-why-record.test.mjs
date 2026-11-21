// The "kenapa dicatat" section compares a single record with repeated ones and
// shows a three-step research loop that reveals itself as the reader scrolls.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { sectionHtml } from './helpers/html.mjs';

/** Aria label of the single-record illustration. */
const SINGLE_LABEL = 'Ilustrasi: satu titik terisi dan tiga titik kosong';

/** Aria label of the repeated-record illustration. */
const REPEAT_LABEL =
  'Ilustrasi: empat titik terhubung garis, turun di titik kedua, naik sedikit, lalu naik lagi';

/** Reveal binding shared by both illustrations. */
const REVEAL = "shown ? 'opacity-100 scale-100' : 'opacity-0 scale-50'";

let section = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  section = sectionHtml(readBuilt('index.html'), 'kenapa-dicatat');
});

/** Attribute value of an opening tag, quoted or minified; null when absent. */
function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

/** Numeric attribute value of an opening tag. */
function num(tag, name) {
  return Number(attr(tag, name));
}

/** Class tokens of an opening tag; empty when it has no class attribute. */
function classes(tag) {
  return (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
}

/** Whether an opening tag carries a class token. */
function has(tag, token) {
  return classes(tag).includes(token);
}

/** Opening tags of an element name, attributes included. */
function openingTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

/** Svg markup of the comparison illustration with the given aria label. */
function illustration(label) {
  const at = section.indexOf(`aria-label="${label}"`);
  assert.notEqual(at, -1, `the illustration "${label}" is rendered`);
  const start = section.lastIndexOf('<svg', at);
  return section.slice(start, section.indexOf('</svg>', start) + '</svg>'.length);
}

/** Trajectory points of the repeated-record illustration, in order. */
function repeatPoints() {
  return openingTags(illustration(REPEAT_LABEL), 'circle').map((tag) => [
    num(tag, 'cx'),
    num(tag, 'cy'),
  ]);
}

/** Loop list with each step's opening tag and body, parsed once. */
function loopItems() {
  const list = openingTags(section, 'ol').find((tag) => has(tag, 'flex-col') && has(tag, 'lg:flex-row'));
  assert.ok(list, 'the steps sit in an <ol class="flex flex-col ... lg:flex-row">');
  const start = section.indexOf(list);
  const markup = section.slice(start, section.indexOf('</ol>', start));
  const items = [...markup.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => ({
    tag: match[0].slice(0, match[0].indexOf('>') + 1),
    inner: match[1],
  }));
  return { list, items };
}

test('the section renders the new lead and no blockquote', () => {
  const lead =
    'Kebijakan yang baik butuh data yang baik, dan peneliti perlu mendengarnya langsung dari kita.';
  assert.ok(section.includes(lead), `renders the new lead: ${lead}`);
  assert.doesNotMatch(section, /<blockquote\b/, 'the old quote is gone');
  assert.ok(!section.includes('Satu kali pengisian ibarat satu foto'), 'the old quote copy is gone');
  assert.ok(!section.includes('Ini riset oleh warga. Pengalaman dikumpulkan'), 'the old closing is gone');
});

test('two grid-cols-2 cards each hold a titled, labelled illustration and a caption', () => {
  const grid = openingTags(section, 'div').find(
    (tag) => has(tag, 'grid') && has(tag, 'grid-cols-2') && has(tag, 'gap-4'),
  );
  assert.ok(grid, 'the comparison sits in a grid grid-cols-2 gap-4 container');

  const cards = [...section.matchAll(/<div\b[^>]*>/g)]
    .map((match) => ({ tag: match[0], index: match.index ?? 0 }))
    .filter(
      ({ tag }) =>
        has(tag, 'rounded-lg') && has(tag, 'border') && has(tag, 'border-border') && has(tag, 'bg-card'),
    );
  assert.equal(cards.length, 2, 'exactly two rounded-lg bordered bg-card cards');

  const expected = [
    { title: 'Sekali isi', caption: 'Satu foto, satu momen.', label: SINGLE_LABEL },
    { title: 'Isi berulang', caption: 'Terlihat perubahannya, dan apa yang membantu.', label: REPEAT_LABEL },
  ];

  expected.forEach(({ title, caption, label }, index) => {
    const start = cards[index].index;
    const end = index + 1 < cards.length ? cards[index + 1].index : section.indexOf('</div>', start);
    const card = section.slice(start, end);

    assert.ok(card.includes(title), `card ${index + 1} renders the title "${title}"`);

    const svg = openingTags(card, 'svg').find((tag) => attr(tag, 'role') === 'img');
    assert.ok(svg, `card ${index + 1} renders an <svg role="img">`);
    assert.equal(attr(svg, 'aria-label'), label, `card ${index + 1} labels the illustration`);
    assert.match(attr(svg, 'viewBox') ?? '', /^0 0 120 40$/, `card ${index + 1} uses the 120x40 viewBox`);
    assert.ok(has(svg, 'w-full'), `card ${index + 1} svg spans the card width`);
    assert.ok(has(svg, 'h-auto'), `card ${index + 1} svg keeps its aspect ratio`);

    const titleAt = card.indexOf(title);
    const svgAt = card.indexOf(svg);
    const captionAt = card.indexOf(caption);
    assert.ok(titleAt < svgAt, `card ${index + 1} title sits above the illustration`);
    assert.ok(svgAt < captionAt, `card ${index + 1} caption sits below the illustration`);
  });
});

test('isi berulang draws an uneven four-point trajectory', () => {
  const points = repeatPoints();
  assert.deepEqual(points, [[24, 22], [48, 30], [72, 26], [96, 16]], 'the dots dip, rise a little, then rise');

  const circles = openingTags(illustration(REPEAT_LABEL), 'circle');
  circles.forEach((circle, index) => {
    assert.ok(has(circle, 'fill-turquoise'), `point ${index + 1} is filled`);
  });

  const segments = openingTags(illustration(REPEAT_LABEL), 'line').filter((tag) =>
    has(tag, 'stroke-turquoise'),
  );
  assert.equal(segments.length, 3, 'three segments join the four points');
  segments.forEach((segment, index) => {
    assert.deepEqual(
      [num(segment, 'x1'), num(segment, 'y1'), num(segment, 'x2'), num(segment, 'y2')],
      [...points[index], ...points[index + 1]],
      `segment ${index + 1} joins point ${index + 1} to point ${index + 2}`,
    );
    assert.equal(num(segment, 'stroke-width'), 2, `segment ${index + 1} is a 2px stroke`);
  });
});

test('sekali isi keeps one filled point and three dashed dots on the baseline', () => {
  const lines = openingTags(illustration(SINGLE_LABEL), 'line');
  const baseline = lines.find((tag) => has(tag, 'stroke-border'));
  assert.ok(baseline, 'a muted baseline is drawn');
  assert.deepEqual(
    [num(baseline, 'x1'), num(baseline, 'y1'), num(baseline, 'x2'), num(baseline, 'y2')],
    [4, 22, 116, 22],
    'the baseline is flat at y=22',
  );

  const circles = openingTags(illustration(SINGLE_LABEL), 'circle');
  assert.equal(circles.length, 4, 'four dots are drawn');
  circles.forEach((circle) => {
    assert.equal(num(circle, 'cy'), 22, 'every dot sits on the baseline');
  });

  const filled = circles.filter((circle) => has(circle, 'fill-turquoise'));
  assert.equal(filled.length, 1, 'exactly one dot is filled');
  assert.equal(num(filled[0], 'cx'), 24, 'the filled dot starts the same trajectory');

  const dashed = circles.filter((circle) => has(circle, 'fill-none'));
  assert.deepEqual(dashed.map((circle) => num(circle, 'cx')), [48, 72, 96], 'three dots stay dashed');
  dashed.forEach((circle) => {
    assert.ok(has(circle, 'stroke-charcoal-400'), 'dashed dots use the muted stroke');
    assert.match(attr(circle, 'stroke-dasharray') ?? '', /^\S+ \S+$/, 'dashed dots use a dash pattern');
  });
});

test('both illustrations reveal their dots and segments from one shared state', () => {
  const grid = openingTags(section, 'div').find(
    (tag) => has(tag, 'grid') && has(tag, 'grid-cols-2') && has(tag, 'gap-4'),
  );
  assert.equal(attr(grid, 'x-data'), 'jtReveal()', 'the grid shares one reveal state');

  // The muted baseline is static decoration; only the dots and trajectory segments animate.
  const segments = (label) =>
    openingTags(illustration(label), 'line').filter((tag) => !has(tag, 'stroke-border'));
  const marks = [SINGLE_LABEL, REPEAT_LABEL].flatMap((label) => [
    ...openingTags(illustration(label), 'circle'),
    ...segments(label),
  ]);
  assert.equal(marks.length, 11, 'both cards animate their dots and segments');

  marks.forEach((tag) => {
    assert.equal(attr(tag, ':class'), REVEAL, 'the mark toggles between hidden and shown');
    assert.ok(has(tag, 'transform-fill'), 'the mark scales around its own centre');
    assert.ok(has(tag, 'origin-center'), 'the mark scales from its centre point');
    assert.ok(has(tag, 'motion-reduce:transition-none'), 'the mark honours reduced motion');
    assert.ok(!has(tag, 'opacity-0'), 'the mark never hides statically');
  });

  const dots = openingTags(illustration(REPEAT_LABEL), 'circle');
  assert.deepEqual(
    dots.map((tag) => classes(tag).find((token) => /^delay-\d+$/.test(token))),
    ['delay-0', 'delay-300', 'delay-600', 'delay-900'],
    'the repeat dots appear one after another',
  );
});

test('the muted note and the loop heading are rendered', () => {
  const note = 'Ilustrasi, bukan data. Ikut satu kali pun tetap berharga.';
  const noteTag = openingTags(section, 'p').find((tag) => {
    const index = section.indexOf(tag);
    return section.slice(index + tag.length, section.indexOf('</p>', index)).includes(note);
  });
  assert.ok(noteTag, 'the compare note is rendered');
  assert.ok(has(noteTag, 'text-muted-foreground'), 'the note is muted');
  assert.match(section, /Ini riset oleh warga, untuk warga\./);
});

test('the loop renders an ol with lg:flex-row and three steps', () => {
  const { items } = loopItems();
  assert.equal(items.length, 3, 'three loop steps are rendered');

  const expected = [
    ['Warga mengisi', 'Sepuluh menit, tanpa nama.'],
    ['Peneliti menganalisis', 'Jawaban diolah dengan ID acak, bukan identitas.'],
    ['Hasil kembali ke publik', 'Temuan dibagikan dalam bahasa sehari-hari.'],
  ];

  items.forEach(({ inner: item }, index) => {
    const [title, text] = expected[index];
    assert.ok(item.includes(title), `step ${index + 1} renders "${title}"`);
    assert.ok(item.includes(text), `step ${index + 1} renders its text`);
    assert.ok(
      openingTags(item, 'svg').some((svg) => attr(svg, 'aria-hidden') === 'true'),
      `step ${index + 1} icon is decorative`,
    );
  });
});

test('each loop step icon sits in a circle and no arrows remain', () => {
  loopItems().items.forEach(({ inner }, index) => {
    const circle = openingTags(inner, 'span').find(
      (tag) =>
        has(tag, 'h-10') && has(tag, 'w-10') && has(tag, 'rounded-full') && has(tag, 'border-border'),
    );
    assert.ok(circle, `step ${index + 1} wraps its icon in a 10x10 circle`);
    assert.equal(attr(circle, 'aria-hidden'), 'true', `step ${index + 1} circle is decorative`);

    const icon = openingTags(inner.slice(inner.indexOf(circle)), 'svg');
    assert.equal(icon.length, 1, `step ${index + 1} circle holds exactly one icon`);
    assert.match(attr(icon[0], 'viewBox') ?? '', /^0 0 24 24$/, `step ${index + 1} icon is a Lucide svg`);

    const arrows = openingTags(inner, 'svg').filter((svg) => has(svg, 'rotate-90') && has(svg, 'lg:rotate-0'));
    assert.equal(arrows.length, 0, `step ${index + 1} carries no arrow`);
  });
});

test('each loop step reveals itself on entry with a staggered delay', () => {
  const delays = ['', 'lg:delay-150', 'lg:delay-300'];

  loopItems().items.forEach(({ tag }, index) => {
    assert.equal(attr(tag, 'x-data'), 'jtReveal()', `step ${index + 1} binds its own reveal state`);
    assert.equal(
      attr(tag, ':class'),
      "shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'",
      `step ${index + 1} lifts in from below`,
    );
    assert.ok(has(tag, 'motion-reduce:transition-none'), `step ${index + 1} honours reduced motion`);
    assert.ok(!has(tag, 'opacity-0'), `step ${index + 1} never hides statically`);
    assert.ok(has(tag, 'relative'), `step ${index + 1} anchors its connector`);
    assert.ok(has(tag, 'lg:flex-col'), `step ${index + 1} stacks at lg`);

    const delay = delays[index];
    if (delay) assert.ok(has(tag, delay), `step ${index + 1} carries ${delay}`);
  });
});

test('a static connector joins the first two steps to the next one', () => {
  loopItems().items.forEach(({ inner }, index) => {
    const connectors = openingTags(inner, 'span').filter((tag) => /\bdata-loop-connector\b/.test(tag));
    if (index === 2) {
      assert.equal(connectors.length, 0, 'the last step has no trailing connector');
      return;
    }
    assert.equal(connectors.length, 1, `step ${index + 1} carries one connector`);
    assert.equal(attr(connectors[0], 'aria-hidden'), 'true', 'the connector is decorative');
    assert.ok(has(connectors[0], 'bg-border'), 'the connector is a hairline');
    assert.ok(has(connectors[0], 'absolute'), 'the connector is positioned absolutely');
  });
});
