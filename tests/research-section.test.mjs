import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readBuilt } from './helpers/build.mjs';
import { read } from './helpers/html.mjs';

const RESEARCH_DIR = path.join(ROOT, 'content/research');

/**
 * Reads one top-level scalar value from a Markdown front matter block.
 * Quoted and unquoted values are both supported.
 * @param {string} source raw Markdown file contents
 * @param {string} key front matter key
 * @returns {string|undefined} the field value, or undefined when the key is absent
 */
function frontMatter(source, key) {
  const match = source.match(
    new RegExp(`^${key}:\\s*(?:"([^"]*)"|'([^']*)'|(.*?))\\s*$`, 'm'),
  );
  if (!match) return undefined;
  return match[1] ?? match[2] ?? match[3];
}

/**
 * Loads every research study declared under content/research.
 * `_index.md` is the listing page and is skipped.
 * @returns {Array<{ slug: string, source: string, field: (key: string) => string|undefined }>} studies in file-name order
 */
function studies() {
  return fs
    .readdirSync(RESEARCH_DIR)
    .filter((file) => file.endsWith('.md') && file !== '_index.md')
    .sort()
    .map((file) => {
      const source = read(path.join(RESEARCH_DIR, file));
      return {
        slug: file.replace(/\.md$/, ''),
        source,
        field: (key) => frontMatter(source, key),
      };
    });
}

/**
 * Escapes a string for safe use inside a regular expression.
 * @param {string} value raw text
 * @returns {string} regex-escaped text
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches a root-relative or canonical-baseURL href to the given path. */
function hrefPattern(target) {
  return new RegExp(`href=["']?(?:https:\\/\\/konsulin\\.care)?${escapeRegex(target)}["'\\s>]`);
}

test('research list renders one linked card per study with its front-matter title', () => {
  const all = studies();
  const html = readBuilt('research/index.html');
  const cards = html.match(/<li\b[^>]*\bdata-study-card\b[^>]*>[\s\S]*?<\/li>/g) ?? [];

  assert.equal(cards.length, all.length);

  for (const study of all) {
    const title = study.field('title');
    assert.ok(title, `${study.slug} declares a title`);
    const card = cards.find((markup) => markup.includes(title));
    assert.ok(card, `the list shows a card titled ${title}`);
    assert.match(
      card,
      hrefPattern(`/research/${study.slug}/`),
      `the card links /research/${study.slug}/`,
    );
  }
});

test('upcoming studies show a non-empty status badge and no study CTA', () => {
  for (const study of studies()) {
    if (study.field('status') !== 'upcoming') continue;

    const html = readBuilt(`research/${study.slug}/index.html`);
    const badge = html.match(/\bdata-study-status\b[^>]*>([^<]*)</);
    assert.ok(badge, `${study.slug} renders a status badge`);
    assert.ok(badge[1].trim().length > 0, `${study.slug} status badge is non-empty`);

    assert.ok(!html.includes('data-study-cta'), `${study.slug} has no study CTA`);
    const ctaUrl = study.field('cta_url');
    if (ctaUrl) {
      assert.ok(!html.includes(ctaUrl), `${study.slug} does not forward-link its CTA URL`);
    }
  }
});

test('research pages contain no TODO(maintainer) placeholders', () => {
  const paths = ['research/index.html', ...studies().map((study) => `research/${study.slug}/index.html`)];
  for (const rel of paths) {
    assert.ok(!readBuilt(rel).includes('TODO(maintainer)'), `${rel} has no TODO(maintainer)`);
  }
});

test('study pages render the summary, question and team from front matter', () => {
  for (const study of studies()) {
    const html = readBuilt(`research/${study.slug}/index.html`);
    for (const key of ['summary', 'question', 'team']) {
      const value = study.field(key);
      if (!value) continue;
      assert.ok(html.includes(value), `${study.slug} renders its ${key}`);
    }
  }
});

test('study pages render the ethics status verbatim', () => {
  for (const study of studies()) {
    const ethicsStatus = study.field('ethics_status');
    if (!ethicsStatus) continue;
    assert.ok(
      readBuilt(`research/${study.slug}/index.html`).includes(ethicsStatus),
      `${study.slug} renders its ethics status verbatim`,
    );
  }
});
