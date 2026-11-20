import fs from 'node:fs';
import path from 'node:path';

/** Absolute path to the repository root. */
export const ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * Reads a repository file.
 * @param {string} rel path relative to the repository root, or an absolute path
 * @returns {string} file contents as UTF-8
 */
export function read(rel) {
  return fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');
}

/**
 * Escapes a string for safe use inside a regular expression.
 * @param {string} value raw text
 * @returns {string} regex-escaped text
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns the full markup of the rendered `<section>` with the given id,
 * from its opening tag through the matching closing tag.
 * Works with quoted and unquoted (minified) attributes.
 * @param {string} html rendered HTML
 * @param {string} id section DOM id
 * @returns {string} section markup including the closing `</section>` tag
 */
export function sectionHtml(html, id) {
  const idPattern = new RegExp(`\\bid\\s*=\\s*["']?${escapeRegex(id)}["'\\s>]`);
  for (const match of html.matchAll(/<section\b[^>]*>/g)) {
    if (!idPattern.test(match[0])) continue;
    const start = match.index ?? 0;
    const end = html.indexOf('</section>', start);
    if (end < 0) return html.slice(start);
    return html.slice(start, end + '</section>'.length);
  }
  throw new Error(`missing rendered <section id="${id}">`);
}

/**
 * Returns the class tokens of the rendered `<section>` with the given id.
 * @param {string} html rendered HTML
 * @param {string} id section DOM id
 * @returns {string[]} class tokens, or an empty array when the section has no class attribute
 */
export function sectionClasses(html, id) {
  const markup = sectionHtml(html, id);
  const opening = markup.match(/<section\b[^>]*>/)?.[0] ?? '';
  const quoted = opening.match(/\bclass\s*=\s*"([^"]*)"/) ?? opening.match(/\bclass\s*=\s*'([^']*)'/);
  if (quoted) return quoted[1].split(/\s+/).filter(Boolean);
  const unquoted = opening.match(/\bclass\s*=\s*([^\s>]+)/);
  return unquoted ? [unquoted[1]] : [];
}

/**
 * Parses the `(dict "num" …)` registry lines of layouts/index.html.
 * @returns {Array<{ num: number|undefined, tone: string|undefined, id: string|undefined, partial: string|undefined, key: string|undefined }>} registered sections in source order
 */
export function parseSections() {
  const index = read('layouts/index.html');
  return index
    .split('\n')
    .filter((line) => /\(dict\s+"num"/.test(line))
    .map((line) => ({
      num: Number(line.match(/"num"\s+(\d+)/)?.[1]),
      tone: line.match(/"tone"\s+"([^"]+)"/)?.[1],
      id: line.match(/"id"\s+"([^"]+)"/)?.[1],
      partial: line.match(/"partial"\s+"([^"]+)"/)?.[1],
      key: line.match(/"key"\s+"([^"]+)"/)?.[1],
    }));
}
