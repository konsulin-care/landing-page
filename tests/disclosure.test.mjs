// Data disclosure (T6/T7): the protocol and the access register ship as static files.
//   D1  the production build emits disclosure/protocol.md with its front matter
//   D2  static/_headers serves /disclosure/* as plain UTF-8 text
//   D3  the protocol states the public-tier thresholds k >= 11 and l >= 2
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), 'utf8');

let dest = '';

before(() => {
  dest = path.resolve(fs.mkdtempSync(path.join(os.tmpdir(), 'disclosure-')));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
});

/** Returns a `key: value` pair from the front matter of the given built file. */
function frontMatter(file, key) {
  const source = read(path.join(dest, file));
  const m = source.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'));
  assert.ok(m, `${file} declares ${key}`);
  return m[1].trim();
}

// ── D1 protocol front matter ───────────────────────────────────────
test('D1a: the build emits disclosure/protocol.md', () => {
  assert.ok(
    fs.existsSync(path.join(dest, 'disclosure/protocol.md')),
    'the built site contains disclosure/protocol.md',
  );
});

test('D1b: the protocol front matter declares frozen status, steward and reviewer', () => {
  assert.equal(frontMatter('disclosure/protocol.md', 'status'), 'frozen');
  assert.equal(frontMatter('disclosure/protocol.md', 'steward'), 'Aly Lamuri');
  assert.match(frontMatter('disclosure/protocol.md', 'reviewer'), /Haykal Hafidzul Arifin/);
});

// ── D2 headers ─────────────────────────────────────────────────────
test('D2a: static/_headers serves /disclosure/* as plain UTF-8 text', () => {
  const headers = read('static/_headers');
  const block = headers.match(/^\/disclosure\/\*$/m);
  assert.ok(block, '/disclosure/* block exists in static/_headers');
  const after = headers.slice(block.index);
  assert.match(after, /^\s+Content-Type: text\/plain; charset=utf-8$/m);
});

// ── D3 thresholds ──────────────────────────────────────────────────
test('D3a: the protocol states k >= 11 and l >= 2 for the public tier', () => {
  const protocol = read(path.join(dest, 'disclosure/protocol.md'));
  assert.match(protocol, /k\s*(?:≥|>=)\s*11/, 'k threshold is stated');
  assert.match(protocol, /l\s*(?:≥|>=)\s*2/, 'l threshold is stated');
});
