import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';

let homeHtml = '';
let contactHtml = '';

/**
 * Matches an HTML attribute value in quoted, single-quoted or unquoted form.
 * @param {string} name attribute name
 * @param {string} value expected attribute value
 * @returns {RegExp} pattern that matches the attribute with that value
 */
function attribute(name, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${name}\\s*=\\s*(?:"${escaped}"|'${escaped}'|${escaped}(?=[\\s>/]))`);
}

/**
 * Extracts the opening tags of the given element name.
 * @param {string} html rendered HTML
 * @param {string} name element name, e.g. `button` or `a`
 * @returns {string[]} opening tags including attributes
 */
function openingTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

/**
 * Reads the class tokens of an opening tag.
 * @param {string} tag rendered opening tag
 * @returns {string[]} class tokens, or an empty array when there is no class attribute
 */
function classesOf(tag) {
  const quoted = tag.match(/\bclass\s*=\s*"([^"]*)"/) ?? tag.match(/\bclass\s*=\s*'([^']*)'/);
  if (quoted) return quoted[1].split(/\s+/).filter(Boolean);
  const unquoted = tag.match(/\bclass\s*=\s*([^\s>]+)/);
  return unquoted ? [unquoted[1]] : [];
}

before(() => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  homeHtml = readBuilt('index.html');
  contactHtml = readBuilt('contact/index.html');
});

test('the contact page renders its submit CTA as a pill button', () => {
  const submitButtons = openingTags(contactHtml, 'button').filter((tag) =>
    attribute('type', 'submit').test(tag),
  );

  assert.ok(submitButtons.length > 0, 'the contact page renders a submit button');
  for (const tag of submitButtons) {
    assert.ok(
      classesOf(tag).includes('rounded-full'),
      `submit button is a pill: ${tag}`,
    );
  }
});

test('the homepage renders button.html CTAs as anchors with an href', () => {
  const ctaAnchors = openingTags(homeHtml, 'a').filter((tag) =>
    classesOf(tag).includes('rounded-full'),
  );

  assert.ok(ctaAnchors.length > 0, 'the homepage renders rounded-full CTA anchors');
  for (const tag of ctaAnchors) {
    assert.match(
      tag,
      /\bhref\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/,
      `CTA anchor has an href: ${tag}`,
    );
  }
});

test('button.html adds w-full only when full is true', () => {
  const pills = openingTags(homeHtml, 'a').filter((tag) => classesOf(tag).includes('rounded-full'));
  assert.ok(pills.some((tag) => classesOf(tag).includes('w-full')), 'a pill renders w-full');
  assert.ok(pills.some((tag) => !classesOf(tag).includes('w-full')), 'a pill renders without w-full');
});

test('the homepage nav toggle controls the menu element', () => {
  const toggles = openingTags(homeHtml, 'button').filter((tag) =>
    attribute('aria-controls', 'menuItems').test(tag),
  );

  assert.equal(toggles.length, 1, 'the nav renders one menu toggle');
  assert.match(toggles[0], attribute('aria-expanded', 'false'), 'the menu starts collapsed');
  assert.match(toggles[0], /@click\s*=\s*["'][^"']*open\s*=\s*!open/, 'the toggle flips the open state');

  const menu = openingTags(homeHtml, 'nav').filter((tag) => attribute('id', 'menuItems').test(tag));
  assert.equal(menu.length, 1, 'the nav renders the element the toggle controls');
});
