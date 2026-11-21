// The "kenapa dicatat" section replaces the long quote with two comparison
// illustrations and a three-step research loop.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { sectionHtml } from './helpers/html.mjs';

let section = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  section = sectionHtml(readBuilt('index.html'), 'kenapa-dicatat');
});

/**
 * Returns an attribute value from an opening tag, supporting quoted and
 * unquoted (minified) attributes.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|null} attribute value, or null when absent
 */
function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3];
}

/**
 * Splits a class attribute value into tokens.
 * @param {string} value class attribute content
 * @returns {string[]} non-empty class tokens
 */
function tokens(value) {
  return value.split(/\s+/).filter(Boolean);
}

/**
 * Parses a class attribute value, supporting quoted and unquoted (minified) values.
 * @param {string} tag opening tag markup
 * @returns {string[]|null} class tokens, or null when the tag has no class attribute
 */
function classTokens(tag) {
  const value = attr(tag, 'class');
  return value === null ? null : tokens(value);
}

/**
 * Extracts the opening tags of an element name.
 * @param {string} html rendered HTML
 * @param {string} name element name
 * @returns {string[]} opening tags including attributes
 */
function openingTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

/**
 * Returns the loop list and its step items, with each opening tag and body
 * kept separately so attribute and content assertions can share one parse.
 * @returns {{ list: string, items: Array<{ tag: string, inner: string }> }} loop markup
 */
function loopItems() {
  const list = openingTags(section, 'ol').find((tag) => {
    const classes = classTokens(tag) ?? [];
    return classes.includes('lg:flex-row') && classes.includes('flex-col');
  });
  assert.ok(list, 'the steps sit in an <ol class="flex flex-col ... lg:flex-row">');

  const listStart = section.indexOf(list);
  const listMarkup = section.slice(listStart, section.indexOf('</ol>', listStart));
  const items = [...listMarkup.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => ({
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
  const grid = openingTags(section, 'div').find((tag) => {
    const classes = classTokens(tag) ?? [];
    return (
      classes.includes('grid') &&
      classes.includes('grid-cols-2') &&
      classes.includes('gap-4')
    );
  });
  assert.ok(grid, 'the comparison sits in a grid grid-cols-2 gap-4 container');

  const cards = [...section.matchAll(/<div\b[^>]*>/g)]
    .map((match) => ({ tag: match[0], index: match.index ?? 0 }))
    .filter(({ tag }) => {
      const classes = classTokens(tag) ?? [];
      return (
        classes.includes('rounded-lg') &&
        classes.includes('border') &&
        classes.includes('border-border') &&
        classes.includes('bg-card')
      );
    });
  assert.equal(cards.length, 2, 'exactly two rounded-lg bordered bg-card cards');

  const expected = [
    {
      title: 'Sekali isi',
      caption: 'Satu foto, satu momen.',
      label: 'Ilustrasi: satu titik terisi dan tiga titik kosong',
    },
    {
      title: 'Isi berulang',
      caption: 'Terlihat perubahannya, dan apa yang membantu.',
      label: 'Ilustrasi: empat titik terisi yang terhubung garis',
    },
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
    const svgClasses = classTokens(svg) ?? [];
    assert.ok(svgClasses.includes('w-full'), `card ${index + 1} svg spans the card width`);
    assert.ok(svgClasses.includes('h-auto'), `card ${index + 1} svg keeps its aspect ratio`);

    const titleAt = card.indexOf(title);
    const svgAt = card.indexOf(svg);
    const captionAt = card.indexOf(caption);
    assert.ok(titleAt < svgAt, `card ${index + 1} title sits above the illustration`);
    assert.ok(svgAt < captionAt, `card ${index + 1} caption sits below the illustration`);
  });
});

test('the muted note and the loop heading are rendered', () => {
  const note =
    'Ilustrasi, bukan data. Ikut satu kali pun tetap berharga.';
  const noteTag = openingTags(section, 'p').find((tag) => {
    const index = section.indexOf(tag);
    const close = section.indexOf('</p>', index);
    return section.slice(index + tag.length, close).includes(note);
  });
  assert.ok(noteTag, 'the compare note is rendered');
  assert.ok((classTokens(noteTag) ?? []).includes('text-muted-foreground'), 'the note is muted');

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

    const svgs = openingTags(item, 'svg');
    assert.ok(svgs.length >= 1, `step ${index + 1} renders a Lucide icon`);
    assert.ok(
      svgs.some((svg) => {
        const classes = classTokens(svg) ?? [];
        return attr(svg, 'aria-hidden') === 'true' && /^0 0 24 24$/.test(attr(svg, 'viewBox') ?? '');
      }),
      `step ${index + 1} icon is a decorative Lucide svg`,
    );

  });
});

test('each loop step icon sits in a circle and no arrows remain', () => {
  const { items } = loopItems();

  items.forEach(({ inner }, index) => {
    const circle = openingTags(inner, 'span').find((tag) => {
      const classes = classTokens(tag) ?? [];
      return (
        classes.includes('h-10') &&
        classes.includes('w-10') &&
        classes.includes('rounded-full') &&
        classes.includes('border') &&
        classes.includes('border-border')
      );
    });
    assert.ok(circle, `step ${index + 1} wraps its icon in a 10x10 circle`);
    assert.equal(attr(circle, 'aria-hidden'), 'true', `step ${index + 1} circle is decorative`);

    const icon = openingTags(inner.slice(inner.indexOf(circle)), 'svg');
    assert.equal(icon.length, 1, `step ${index + 1} circle holds exactly one icon`);
    assert.match(attr(icon[0], 'viewBox') ?? '', /^0 0 24 24$/, `step ${index + 1} icon is a Lucide svg`);

    const arrows = openingTags(inner, 'svg').filter((svg) => {
      const classes = classTokens(svg) ?? [];
      return classes.includes('rotate-90') && classes.includes('lg:rotate-0');
    });
    assert.equal(arrows.length, 0, `step ${index + 1} carries no arrow`);
  });
});

test('each loop step reveals itself on entry with a staggered delay', () => {
  const { items } = loopItems();
  const delays = ['', 'lg:delay-150', 'lg:delay-300'];

  items.forEach(({ tag, inner }, index) => {
    assert.equal(attr(tag, 'x-data'), 'jtReveal()', `step ${index + 1} binds its own reveal state`);

    const bound = attr(tag, ':class') ?? '';
    assert.ok(bound.includes('opacity-100'), `step ${index + 1} reveals to full opacity`);
    assert.ok(bound.includes('translate-y-0'), `step ${index + 1} settles at its final offset`);
    assert.ok(bound.includes('opacity-0'), `step ${index + 1} hides before entry`);
    assert.ok(bound.includes('translate-y-2'), `step ${index + 1} lifts in from below`);

    const classes = classTokens(tag) ?? [];
    assert.ok(classes.includes('motion-reduce:transition-none'), `step ${index + 1} honours reduced motion`);
    assert.ok(!classes.includes('opacity-0'), `step ${index + 1} never hides statically`);
    assert.ok(classes.includes('relative'), `step ${index + 1} anchors its connector`);
    assert.ok(classes.includes('lg:flex-col'), `step ${index + 1} stacks at lg`);

    const delay = delays[index];
    if (delay) {
      assert.ok(classes.includes(delay), `step ${index + 1} carries ${delay}`);
    }
  });
});

test('a static connector joins the first two steps to the next one', () => {
  const { items } = loopItems();

  items.forEach(({ inner }, index) => {
    const connectors = openingTags(inner, 'span').filter((tag) => /\bdata-loop-connector\b/.test(tag));
    if (index < 2) {
      assert.equal(connectors.length, 1, `step ${index + 1} carries one connector`);
      assert.equal(attr(connectors[0], 'aria-hidden'), 'true', 'the connector is decorative');
      const classes = classTokens(connectors[0]) ?? [];
      assert.ok(classes.includes('bg-border'), 'the connector is a hairline');
      assert.ok(classes.includes('absolute'), 'the connector is positioned absolutely');
    } else {
      assert.equal(connectors.length, 0, 'the last step has no trailing connector');
    }
  });
});
