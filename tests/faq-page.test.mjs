import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

/**
 * Reads the group ids declared in content/faq.md front matter.
 * @returns {string[]} group ids in source order
 */
function groupIds() {
  return [...read('content/faq.md').matchAll(/^\s+id:\s*(\S+)\s*$/gm)].map(
    (match) => match[1],
  );
}

/**
 * Counts the help items declared in content/faq.md front matter.
 * @returns {number} number of items marked `help: true`
 */
function helpItemCount() {
  return [...read('content/faq.md').matchAll(/^\s+help:\s*true\s*$/gm)].length;
}

/**
 * Returns the rendered FAQ page markup, failing when the build did not succeed.
 * @returns {string} faq/index.html contents
 */
function faqHtml() {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  return readBuilt('faq/index.html');
}

test('faq renders the group headings with ids in source order', () => {
  const html = faqHtml();
  const ids = [...html.matchAll(/<h2[^>]*\sid=(?:"([^"]+)"|([^\s>]+))/g)].map(
    (match) => match[1] ?? match[2],
  );
  assert.deepEqual(ids, groupIds());
});

test('faq renders one question button per source item, wired to a visible answer', () => {
  const html = faqHtml();
  const buttons = [...html.matchAll(/<button[^>]*data-faq-question[^>]*>/g)].map(
    (match) => match[0],
  );
  assert.ok(buttons.length > 0, 'faq renders question buttons');

  const controls = new Set();
  for (const button of buttons) {
    assert.match(button, /type="?button"?/, button);
    assert.match(button, /aria-expanded=(?:"false"|false)/, button);
    assert.match(button, /:aria-expanded=/, button);
    const match = button.match(/aria-controls=(?:"([^"]+)"|([^\s>]+))/);
    assert.ok(match, button);
    const answerId = match[1] ?? match[2];
    assert.ok(!controls.has(answerId), `duplicate answer id ${answerId}`);
    controls.add(answerId);

    const answer = html.match(
      new RegExp(`<div[^>]*\\sid=(?:"${answerId}"|${answerId}(?=[\\s>]))[^>]*>`),
    );
    assert.ok(answer, `missing answer element ${answerId}`);
    assert.match(answer[0], /x-show=(?:"?open\b)/, answer[0]);
  }
  assert.equal(controls.size, buttons.length);
  assert.ok(!/x-cloak/.test(html), 'answers must stay readable without JS');
});

test('faq renders the help section once, fully visible and before the first group', () => {
  const html = faqHtml();
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  const helpIndex = visible.search(/id=["']?bantuan[\s"'>]/);
  assert.ok(helpIndex >= 0, 'missing id=bantuan');

  const helpSection = visible.match(
    /<section[^>]*\sid=["']?bantuan["'\s>][\s\S]*?<\/section>/,
  );
  assert.ok(helpSection, 'missing section#bantuan');
  assert.ok(
    !/x-show|x-data|x-cloak/.test(helpSection[0]),
    'help answer must be fully visible',
  );

  const firstGroupId = groupIds()[0];
  assert.ok(firstGroupId, 'content declares at least one group');
  const firstGroupIndex = visible.search(
    new RegExp(`id=["']?${firstGroupId}["'\\s>]`),
  );
  assert.ok(firstGroupIndex >= 0, 'missing first group heading');
  assert.ok(
    helpIndex < firstGroupIndex,
    'help section must be placed before the first group',
  );
});

test('faq emits one structured Question per rendered question plus the help item', () => {
  const html = faqHtml();
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type="?application\/ld\+json"?[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ];
  assert.ok(blocks.length > 0, 'missing application/ld+json script');

  const faq = blocks
    .map((block) => JSON.parse(block[1]))
    .find((data) => data['@type'] === 'FAQPage');
  assert.ok(faq, 'missing FAQPage structured data');
  assert.equal(faq['@context'], 'https://schema.org');
  assert.ok(Array.isArray(faq.mainEntity), 'mainEntity must be an array');

  const buttons = [...html.matchAll(/<button[^>]*data-faq-question[^>]*>/g)];
  assert.equal(faq.mainEntity.length, buttons.length + helpItemCount());

  const questions = faq.mainEntity.map((entry) => {
    assert.equal(entry['@type'], 'Question');
    assert.equal(typeof entry.name, 'string');
    assert.ok(entry.name.length > 0);
    assert.equal(entry.acceptedAnswer['@type'], 'Answer');
    assert.equal(typeof entry.acceptedAnswer.text, 'string');
    assert.ok(entry.acceptedAnswer.text.length > 0);
    return entry.name;
  });
  assert.equal(new Set(questions).size, questions.length);
});

/**
 * Extracts the id referenced by an element's aria-controls attribute.
 * @param {string} tag the element's opening tag markup
 * @returns {string} the referenced element id
 */
function controlsId(tag) {
  const match = tag.match(/aria-controls=(?:"([^"]+)"|([^\s>]+))/);
  assert.ok(match, tag);
  return match[1] ?? match[2];
}

test('faq opens one answer at a time from a single shared scope', () => {
  const html = faqHtml();

  const scopes = [...html.matchAll(/x-data="\{\s*open:\s*null\s*\}"/g)];
  assert.equal(scopes.length, 1, 'exactly one accordion scope declares open: null');

  const wrappers = [
    ...html.matchAll(/<div[^>]*class="border rounded-lg border-border bg-card"[^>]*>/g),
  ].map((match) => match[0]);
  assert.ok(wrappers.length > 0, 'faq renders question wrappers');
  for (const wrapper of wrappers) {
    assert.doesNotMatch(wrapper, /x-data/, `no per-question open state: ${wrapper}`);
  }

  const buttons = [...html.matchAll(/<button[^>]*data-faq-question[^>]*>/g)].map(
    (match) => match[0],
  );
  assert.ok(buttons.length > 0, 'faq renders question buttons');

  const keys = new Set();
  for (const button of buttons) {
    const answerId = controlsId(button);
    const key = `open === '${answerId}'`;
    assert.ok(
      button.includes(`@click="open = ${key} ? null : '${answerId}'"`),
      `button toggles its own key: ${button}`,
    );
    assert.ok(
      button.includes(`:aria-expanded="(${key}).toString()"`),
      `button reflects its own key: ${button}`,
    );
    assert.match(button, /aria-expanded="?false"?/, button);
    assert.ok(!keys.has(answerId), `duplicate answer key ${answerId}`);
    keys.add(answerId);

    const answer = html.match(
      new RegExp(`<div[^>]*\\sid=(?:"${answerId}"|${answerId}(?=[\\s>]))[^>]*>`),
    );
    assert.ok(answer, `missing answer element ${answerId}`);
    assert.ok(
      answer[0].includes(`x-show="${key}"`),
      `answer reads the same key as its button: ${answer[0]}`,
    );
  }

  assert.ok(!/x-cloak/.test(html), 'answers stay readable without JS');
});

test('faq source has no bracket placeholders', () => {
  const source = read('content/faq.md');
  const withoutLinks = source.replace(/\[[^\]]*\]\([^)]*\)/g, '');
  assert.ok(
    !/[\[\]]/.test(withoutLinks),
    'content/faq.md still contains a bracket placeholder',
  );
});
