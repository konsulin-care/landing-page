import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, readBuilt } from './helpers/build.mjs';

const SITE_ORIGIN = 'https://konsulin.care';

/**
 * Reads an HTML attribute from an opening tag, accepting double-quoted,
 * single-quoted and unquoted (minified) values.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|undefined} attribute value, or undefined when absent
 */
function attribute(tag, name) {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  );
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

/**
 * Collects same-origin asset URLs referenced by the rendered markup.
 * Only `<script src>` and `<link rel="stylesheet" href>` are considered.
 * @param {string} html rendered page markup
 * @returns {Array<{ tag: string, url: string, integrity: string|undefined }>} referenced assets
 */
function assetReferences(html) {
  const assets = [];
  for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = attribute(match[0], 'src');
    if (src) assets.push({ tag: match[0], url: src, integrity: attribute(match[0], 'integrity') });
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attribute(match[0], 'rel');
    if (!rel || rel.toLowerCase() !== 'stylesheet') continue;
    const href = attribute(match[0], 'href');
    if (href) assets.push({ tag: match[0], url: href, integrity: attribute(match[0], 'integrity') });
  }
  return assets;
}

/**
 * Resolves a same-origin asset URL to a path relative to the build destination.
 * @param {string} url root-relative or absolute site URL
 * @returns {string|null} build-relative path, or null when the URL is not same-origin
 */
function buildRelative(url) {
  const pathname = url.split(/[?#]/, 1)[0];
  if (pathname.startsWith(`${SITE_ORIGIN}/`)) return pathname.slice(SITE_ORIGIN.length + 1);
  if (pathname === SITE_ORIGIN) return 'index.html';
  if (pathname.startsWith('/')) return pathname.slice(1);
  return null;
}

/**
 * Extracts the content hash from a fingerprinted filename such as
 * `style.min.<64hex>.css`.
 * @param {string} filename asset filename
 * @returns {string|undefined} the 64-character hex hash, or undefined
 */
function fingerprintHash(filename) {
  return filename.match(/\.([0-9a-f]{64})\.[^./]+$/)?.[1];
}

test('every referenced script and stylesheet is same-origin and exists in the build', () => {
  const { dest } = buildSite();
  const html = readBuilt('index.html');
  const assets = assetReferences(html);

  assert.ok(assets.length > 0, 'the homepage references at least one asset');

  for (const { url } of assets) {
    const relative = buildRelative(url);
    assert.ok(relative, `asset ${url} must be same-origin or root-relative`);
    const file = path.join(dest, relative);
    assert.ok(fs.existsSync(file), `asset ${url} must resolve to ${relative} in the build`);
  }
});

test('every referenced asset filename hash matches its content', () => {
  const { dest } = buildSite();
  const html = readBuilt('index.html');

  for (const { url } of assetReferences(html)) {
    const relative = buildRelative(url);
    assert.ok(relative, `asset ${url} must be same-origin or root-relative`);
    const file = path.join(dest, relative);
    const hash = fingerprintHash(path.basename(relative));
    assert.ok(hash, `asset ${url} must carry a fingerprint in its filename`);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.equal(digest, hash, `asset ${url} filename hash must match its content`);
  }
});

test('every referenced asset carries a matching sha256 integrity attribute', () => {
  const { dest } = buildSite();
  const html = readBuilt('index.html');

  for (const { url, integrity } of assetReferences(html)) {
    const relative = buildRelative(url);
    assert.ok(relative, `asset ${url} must be same-origin or root-relative`);
    const file = path.join(dest, relative);
    const expected = `sha256-${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('base64')}`;
    assert.equal(integrity, expected, `asset ${url} integrity attribute must match its content`);
  }
});
