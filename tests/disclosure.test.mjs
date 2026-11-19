import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

/** Release documents that must ship with the built site. */
const DISCLOSURE_FILES = [
  'disclosure/protocol.md',
  'disclosure/data-access-register.md',
  'disclosure/data-use-agreement.md',
  'disclosure/variable-disclosure-table.md',
];

/**
 * Reads a top-level `key: value` pair from the front matter of a built file.
 * @param {string} file path relative to the build destination
 * @param {string} key front matter key to read
 * @returns {string} the trimmed value
 */
function frontMatter(file, key) {
  const source = readBuilt(file);
  const match = source.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'));
  assert.ok(match, `${file} declares ${key}`);
  return match[1].trim();
}

/**
 * Asserts the shared Hugo build succeeded before reading its output.
 * @returns {void}
 */
function assertBuild() {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
}

test('the build emits the four disclosure documents', () => {
  assertBuild();
  for (const file of DISCLOSURE_FILES) {
    assert.doesNotThrow(() => readBuilt(file), `the built site contains ${file}`);
  }
});

test('protocol front matter declares a semver version and a permalink to the superseded copy', () => {
  assertBuild();
  assert.match(frontMatter('disclosure/protocol.md', 'version'), /^\d+\.\d+\.\d+$/);
  assert.match(
    frontMatter('disclosure/protocol.md', 'supersedes'),
    /^https:\/\/github\.com\/konsulin-care\/landing-page\/blob\/[0-9a-f]{40}\/static\/disclosure\/protocol\.md$/,
  );
});

test('static/_headers serves /disclosure/* as plain UTF-8 text', () => {
  const headers = read('static/_headers');
  const block = headers.match(/^\/disclosure\/\*$/m);
  assert.ok(block, '/disclosure/* block exists in static/_headers');
  const after = headers.slice(block.index);
  assert.match(after, /^\s+Content-Type: text\/plain; charset=utf-8$/m);
});

test('the rendered /privacy/ page links the protocol and the access register', () => {
  assertBuild();
  const html = readBuilt('privacy/index.html');
  for (const target of ['/disclosure/protocol.md', '/disclosure/data-access-register.md']) {
    const pattern = new RegExp(
      `href="?(?:https:\\/\\/konsulin\\.care)?${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?[\\s>]`,
    );
    assert.match(html, pattern, `/privacy/ links ${target}`);
  }
});
