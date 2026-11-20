import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read, sectionHtml } from './helpers/html.mjs';

let section = '';

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  section = sectionHtml(readBuilt('index.html'), 'kenali-tandanya');
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
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3];
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

/** Reads `params.forward` from hugo.yaml. */
function forwardUrl() {
  const match = read('hugo.yaml').match(/^\s{2}forward:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
  assert.ok(match, 'params.forward is configured');
  return match[1].trim();
}

/** Strips the site baseURL so root-relative and absolute hrefs compare equally. */
function normalizeHref(href) {
  return href.replace(/^https:\/\/konsulin\.care/, '');
}

/** Reads the Lucide icon set shipped in node_modules. */
function lucideIcons() {
  return JSON.parse(read('node_modules/@iconify-json/lucide/icons.json')).icons;
}

/**
 * Normalizes SVG markup so Hugo's minifier output compares with Lucide's source.
 * @param {string} markup svg fragment
 * @returns {string} markup without attribute quotes and with collapsed whitespace
 */
function normalizeSvg(markup) {
  return markup.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Lists the shape elements of an SVG fragment in document order. Hugo's minifier
 * rewrites path data but leaves circle, rect, line and polygon geometry alone.
 * @param {string} markup svg fragment
 * @returns {string[]} normalized opening tags of the shape elements
 */
function shapesOf(markup) {
  return [...markup.matchAll(/<(circle|ellipse|rect|line|polyline|polygon)\b[^>]*>/g)].map((match) =>
    normalizeSvg(match[0]),
  );
}

/**
 * Lists the moveto start point of every path in an SVG fragment. The minifier
 * shortens command letters and later curve segments but keeps each start point.
 * @param {string} markup svg fragment
 * @returns {string[]} first coordinate pair of each path's `d` attribute
 */
function pathStarts(markup) {
  return [...markup.matchAll(/<path\b[^>]*\bd=("[^"]*"|'[^']*')/g)].map((match) => {
    const d = match[1].replace(/^["']|["']$/g, '');
    return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).slice(0, 2).join(',');
  });
}

/**
 * Checks whether rendered icon markup draws the same geometry as a Lucide body:
 * identical shape elements and identical path start points.
 * @param {string} rendered inner markup of the rendered svg
 * @param {string} body Lucide icon body from icons.json
 * @returns {boolean} true when the rendered icon is that Lucide icon
 */
function rendersIcon(rendered, body) {
  return (
    JSON.stringify(shapesOf(rendered)) === JSON.stringify(shapesOf(body)) &&
    JSON.stringify(pathStarts(rendered)) === JSON.stringify(pathStarts(body))
  );
}

/**
 * Returns the inner markup of the icon svg of the tile carrying the given label.
 * @param {string} label visible sign label, for example "Tubuh"
 * @returns {string} inner markup of the tile's first svg
 */
function tileIcon(label) {
  const tile = [...section.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)]
    .map((match) => match[1])
    .find((inner) => inner.includes(`>${label}<`));
  assert.ok(tile, `${label} tile is rendered`);
  const icon = tile.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  assert.ok(icon, `${label} tile renders an icon svg`);
  return icon[1];
}

test('the section renders the prompt, hint and six tappable signs with Lucide icons and a check', () => {
  assert.match(section, /Yang mana yang terasa akrab\?/);
  assert.match(section, /Pilih satu atau lebih\./);
  assert.doesNotMatch(section, /Ketuk yang cocok\./);

  const buttons = [...section.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map((match) => ({
    tag: match[0].slice(0, match[0].indexOf('>') + 1),
    inner: match[1],
  }));
  assert.equal(buttons.length, 6, 'six sign tiles are rendered');

  const signs = [
    ['Tubuh', 'Perut mulas'],
    ['Tidur', 'Bangun tidur'],
    ['Pikiran', 'Banyak'],
    ['Uang', 'Cemas tiap'],
    ['Hubungan', 'Mudah marah'],
    ['Diam', 'Bilang'],
  ];

  buttons.forEach((button, index) => {
    const [label, text] = signs[index];
    assert.equal(attr(button.tag, 'type'), 'button', `${label} tile is a button`);
    assert.equal(attr(button.tag, 'aria-pressed'), 'false', `${label} tile starts unpressed`);
    assert.match(attr(button.tag, '@click') ?? '', /toggle\(/, `${label} tile toggles its state`);
    assert.match(button.inner, new RegExp(label), `${label} label is rendered`);
    assert.match(button.inner, new RegExp(text), `${label} text is rendered`);

    const svgs = openingTags(button.inner, 'svg');
    assert.ok(svgs.length >= 2, `${label} tile renders an icon and a check indicator`);
    for (const svg of svgs) {
      assert.equal(attr(svg, 'aria-hidden'), 'true', `${label} icon is decorative`);
      assert.match(svg, /viewBox\s*=\s*["']?0 0 24 24/i, `${label} icon is a Lucide svg`);
    }
    assert.ok(
      svgs.some((svg) => (attr(svg, 'class') ?? '').includes('text-turquoise-deep')),
      `${label} icon uses the turquoise accent`,
    );
    assert.ok(
      svgs.some((svg) => (attr(svg, 'class') ?? '').includes('h-4')),
      `${label} tile renders the smaller check icon`,
    );
    assert.match(button.inner, /group-aria-pressed:opacity-100/, `${label} check appears when pressed`);
  });
});

test('every sign tile is a full-height clickable card', () => {
  const buttons = [...section.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(buttons.length, 6, 'six sign tiles are rendered');

  for (const tag of buttons) {
    const label = attr(tag, '@click') ?? tag;
    const tokens = (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
    assert.ok(tokens.includes('h-full'), `${label} tile fills its grid row`);
    assert.ok(tokens.includes('cursor-pointer'), `${label} tile shows a pointer cursor`);
    assert.ok(tokens.includes('hover:border-turquoise'), `${label} tile tints its border on hover`);
  }
});

test('every sign tile shows a resting round check circle that fills when pressed', () => {
  const buttons = [...section.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map((match) => match[1]);
  assert.equal(buttons.length, 6, 'six sign tiles are rendered');

  for (const inner of buttons) {
    const indicator = openingTags(inner, 'span').find((tag) =>
      (attr(tag, 'class') ?? '').includes('group-aria-pressed:bg-turquoise-deep'),
    );
    assert.ok(indicator, 'the tile renders a check indicator');

    const tokens = (attr(indicator, 'class') ?? '').split(/\s+/).filter(Boolean);
    for (const token of ['rounded-full', 'border', 'self-center']) {
      assert.ok(tokens.includes(token), `the check indicator carries ${token}`);
    }
    assert.ok(!tokens.includes('opacity-0'), 'the check indicator is visible at rest');

    assert.ok(
      openingTags(inner, 'svg').some((svg) => (attr(svg, 'class') ?? '').includes('group-aria-pressed:opacity-100')),
      'the check mark appears only while the tile is pressed',
    );
  }
});

test('every sign tile wraps its icon in a bordered circle', () => {
  const buttons = [...section.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map((match) => match[1]);
  assert.equal(buttons.length, 6, 'six sign tiles are rendered');

  for (const inner of buttons) {
    const wrapper = openingTags(inner, 'span').find((tag) => {
      const tokens = (attr(tag, 'class') ?? '').split(/\s+/);
      return tokens.includes('rounded-full') && tokens.includes('border');
    });
    assert.ok(wrapper, 'the tile renders a bordered circle for its icon');

    const start = inner.indexOf(wrapper);
    const wrapperInner = inner.slice(start, inner.indexOf('</span>', start));
    assert.match(wrapperInner, /<svg\b/, 'the icon svg sits inside the bordered circle');
  }
});

test('the Tubuh and Tidur tiles render the user and moon-star Lucide icons', () => {
  const icons = lucideIcons();

  assert.ok(rendersIcon(tileIcon('Tubuh'), icons.user.body), 'the Tubuh tile renders the Lucide user icon');
  assert.ok(rendersIcon(tileIcon('Tidur'), icons['moon-star'].body), 'the Tidur tile renders the Lucide moon-star icon');
});

test('an aria-live region holds the x-cloak selected panel with its CTA and the idle sentence', () => {
  const liveTag = openingTags(section, 'div').find((tag) => attr(tag, 'aria-live') === 'polite');
  assert.ok(liveTag, 'an aria-live="polite" region is rendered');

  const live = section.slice(section.indexOf(liveTag));
  const panel = openingTags(live, 'div').find((tag) => attr(tag, 'x-show') === 'picked.length');
  assert.ok(panel, 'the selected panel shows while at least one sign is picked');
  assert.match(panel, /\bx-cloak\b/, 'the selected panel is hidden before Alpine boots');
  assert.match(live, /Itu wajar, dan Anda nggak sendirian\./);
  assert.match(live, /Survei ini menanyakan apa yang sehari-hari Anda rasakan, seperti tadi\./);

  const cta = openingTags(live, 'a').find((tag) => attr(tag, 'data-cta-location') === 'kenali-tandanya');
  assert.ok(cta, 'the selected panel renders the recognition CTA');
  assert.equal(normalizeHref(attr(cta, 'href')), normalizeHref(forwardUrl()));
  const ctaContent = live.slice(live.indexOf(cta) + cta.length, live.indexOf('</a>', live.indexOf(cta)));
  assert.match(ctaContent, /Mulai Survei \(10 Menit\)/);

  const idle = openingTags(live, 'p').find((tag) => attr(tag, 'x-show') === '!picked.length');
  assert.ok(idle, 'the idle sentence is rendered');
  assert.doesNotMatch(idle, /\bx-cloak\b/, 'the idle sentence is readable without JavaScript');
  assert.match(live, /Kalau Anda mengenali salah satunya, itu wajar, dan Anda nggak sendirian\./);
});

test('the section renders the new note, the help link and no old note or closing copy', () => {
  assert.match(section, /Pilihan Anda di sini tidak disimpan\. Ini bukan daftar untuk mendiagnosis diri\./);

  const anchors = openingTags(section, 'a');
  const help = anchors.find((tag) => normalizeHref(attr(tag, 'href') ?? '') === '/faq/#bantuan');
  assert.ok(help, 'the help link points to /faq/#bantuan');

  assert.ok(!section.includes('mengenali satu tanda bukan berarti'), 'the old note is removed');
  assert.ok(!section.includes('Ini cara untuk saling memahami.'), 'the old note ending is removed');
  assert.ok(!section.includes('memahami kapan perlu mencari dukungan'), 'the old closing copy is removed');
  assert.ok(!section.includes('#JadiTangguh'), 'the hashtag closing anchor is removed');
});
