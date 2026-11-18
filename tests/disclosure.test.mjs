// Data disclosure (T6/T7): the protocol and the access register ship as static files.
//   D1  the production build emits disclosure/protocol.md with its front matter
//   D2  static/_headers serves /disclosure/* as plain UTF-8 text
//   D3  the protocol states the public-tier thresholds k >= 11 and l >= 2
//   D4  the production build emits disclosure/data-access-register.md with its table
//   D5  the rendered /privacy/ page links both disclosure files
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

// ── D4 access register ─────────────────────────────────────────────
test('D4a: the build emits disclosure/data-access-register.md with its table header', () => {
  const file = path.join(dest, 'disclosure/data-access-register.md');
  assert.ok(fs.existsSync(file), 'the built site contains disclosure/data-access-register.md');
  assert.match(read(file), /^\| Institution \| Project title \|/m);
});

// ── D5 privacy page links ──────────────────────────────────────────
test('D5a: the rendered /privacy/ page links both disclosure files', () => {
  const html = read(path.join(dest, 'privacy/index.html'));
  for (const target of ['/disclosure/protocol.md', '/disclosure/data-access-register.md']) {
    const pattern = new RegExp(
      `href="?(?:https:\\/\\/konsulin\\.care)?${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?[\\s>]`,
    );
    assert.match(html, pattern, `/privacy/ links ${target}`);
  }
});

// ── U1 protocol version ────────────────────────────────────────────
const SUPERSEDED_SHA = 'b6cff0829f0c933347973f1c3e1124a203e99c7d';

test('U1a: the protocol declares version 1.1.0', () => {
  assert.equal(frontMatter('disclosure/protocol.md', 'version'), '1.1.0');
});

test('U1b: the protocol supersedes the previous version by permalink', () => {
  assert.equal(
    frontMatter('disclosure/protocol.md', 'supersedes'),
    `https://github.com/konsulin-care/landing-page/blob/${SUPERSEDED_SHA}/static/disclosure/protocol.md`,
  );
});

test('U1c: the revision history lists 1.0.0 and 1.1.0', () => {
  const protocol = read(path.join(dest, 'disclosure/protocol.md'));
  const history = protocol.slice(protocol.indexOf('## 14. Revision history'));
  assert.match(history, /^- 1\.0\.0/m, '1.0.0 is recorded');
  assert.match(history, /^- 1\.1\.0/m, '1.1.0 is recorded');
});

// ── U2 baseline coverage and non-composition ───────────────────────
const protocolText = () => read(path.join(dest, 'disclosure/protocol.md'));

test('U2a: the baseline public file covers every baseline participant', () => {
  const text = protocolText();
  assert.match(text, /The baseline public file covers every baseline participant/);
  assert.doesNotMatch(text, /approximately 70 per cent of that wave/, 'the subsample basis is gone');
});

test('U2b: scores are published as instrument bands with l-diversity on bands', () => {
  const text = protocolText();
  assert.match(text, /bands defined by each instrument's manual/);
  assert.match(text, /l-diversity is computed on the banded score/);
});

test('U2c: the non-composition rule forbids scores with their items and cross-instrument rows', () => {
  const text = protocolText();
  assert.match(text, /never carry a derived score together with the items/);
  assert.match(text, /cross-instrument rows are never published/i);
});

// ── U3 restricted items and open item access ────
test('U3a: the restricted tier lists complete item-level response files', () => {
  assert.match(protocolText(), /\| Restricted \| Complete item-level response files/);
});

test('U3b: open item access is item marginals and an inter-item correlation matrix', () => {
  assert.match(protocolText(), /item marginals and the inter-item correlation matrix/i);
});

test('U3c: the synthetic item file is labelled synthetic and holds no real records', () => {
  const text = protocolText();
  assert.match(text, /synthetic item file, labelled synthetic in its filename and front matter/);
  assert.match(text, /contains no real participant records/);
});

// ── U4 aggregate-only later waves ──
test('U4a: subsequent waves are aggregate tables only, with no microdata', () => {
  const text = protocolText();
  assert.match(text, /Subsequent waves are published as aggregate tables only/);
  assert.match(text, /with no microdata/);
});

test('U4b: aggregate counts are rounded to a base of 5', () => {
  assert.match(protocolText(), /Aggregate counts are rounded to a base of 5/);
});

test('U4c: a marginal budget fixes the tables and bars a complete cross-tabulation set', () => {
  const text = protocolText();
  assert.match(text, /marginal budget fixes which tables each wave releases/);
  assert.match(text, /complete cross-tabulation set is forbidden/);
});

// ── U5 aggregate longitudinal and documentation ────
test('U5a: longitudinal results are transition matrices between banded categories', () => {
  assert.match(protocolText(), /transition matrices between banded categories/);
});

test('U5b: cell definitions are harmonised and never redefined between releases', () => {
  assert.match(protocolText(), /Cell definitions are harmonised across waves and never redefined/);
});

test('U5c: each aggregate wave publishes a codebook and a retention table', () => {
  const text = protocolText();
  assert.match(text, /publishes a codebook listing its variables/);
  assert.match(text, /retention table/);
});

// ── U6 restricted access ────
test('U6a: access runs through one agreement with a confidentiality annex', () => {
  assert.match(
    protocolText(),
    /single Data Use Agreement with a confidentiality annex rather than a separate non-disclosure agreement/,
  );
});

test('U6b: the protocol prohibits linking public releases to restricted data', () => {
  assert.match(protocolText(), /prohibits? linking public releases to restricted data/);
});

test('U6c: the agreement template is published at a disclosure path', () => {
  assert.match(
    protocolText(),
    /template is published at \/disclosure\/data-use-agreement\.md/,
  );
});

// ── U7 data use agreement template ────────────
const agreementText = () => {
  const file = path.join(dest, 'disclosure/data-use-agreement.md');
  assert.ok(fs.existsSync(file), 'the built site contains disclosure/data-use-agreement.md');
  return read(file);
};

test('U7a: the build emits disclosure/data-use-agreement.md', () => {
  assert.match(agreementText(), /^title:/m);
});

test('U7b: the template carries purpose, linking, sharing, security, incident, destruction and audit terms', () => {
  const text = agreementText();
  const required = [
    /purpose limitation/i,
    /must not link public releases to restricted data/i,
    /must not share the data onward/i,
    /security/i,
    /incident reporting/i,
    /destruction/i,
    /audit/i,
  ];
  for (const pattern of required) {
    assert.match(text, pattern, `the template states ${pattern}`);
  }
});

test('U7c: the template states eligibility, timeline, refusal grounds and appeal', () => {
  const text = agreementText();
  for (const pattern of [/eligibility/i, /working days/i, /refusal/i, /appeal/i]) {
    assert.match(text, pattern, `the template states ${pattern}`);
  }
});

// ── U8 variable disclosure table ────────────
const variableTable = () => {
  const file = path.join(dest, 'disclosure/variable-disclosure-table.md');
  assert.ok(fs.existsSync(file), 'the built site contains disclosure/variable-disclosure-table.md');
  return read(file);
};

test('U8a: the build emits disclosure/variable-disclosure-table.md', () => {
  assert.match(variableTable(), /^title:/m);
});

test('U8b: the table uses the four release classifications', () => {
  const text = variableTable();
  for (const label of [
    'Public at full resolution',
    'Public coarsened',
    'Sufficient statistics or synthetic',
    'Restricted',
  ]) {
    assert.match(text, new RegExp(`\\| ${label} \\|`), `the table classifies ${label}`);
  }
});

test('U8c: item-level responses are restricted and scores are coarsened public bands', () => {
  const text = variableTable();
  assert.match(text, /^\| Item-level responses \| Restricted \|/m);
  assert.match(text, /^\| Instrument scores \| Public coarsened \|/m);
});

// ── U9 register links the published agreement ────
test('U9a: the register links the published agreement template', () => {
  const register = read(path.join(dest, 'disclosure/data-access-register.md'));
  assert.match(register, /\/disclosure\/data-use-agreement\.md/);
});

test('U9b: the register presents the agreement as published, not on request', () => {
  const register = read(path.join(dest, 'disclosure/data-access-register.md'));
  assert.doesNotMatch(register, /on request/i);
  assert.match(register, /terms an applicant accepts are published/);
});

// ── U10 privacy page release facts ────
const privacyHtml = () => read(path.join(dest, 'privacy/index.html'));

test('U10a: the privacy page states the baseline is published in full and later waves as aggregates', () => {
  const html = privacyHtml();
  assert.match(html, /publikasikan secara lengkap/, 'baseline completeness is stated');
  assert.match(html, /sebagai tabel ringkasan/, 'the aggregate tier is stated');
});

test('U10b: the privacy page states the opt-out window before the baseline release', () => {
  assert.match(privacyHtml(), /memilih tidak ikut rilis publik/);
  assert.match(privacyHtml(), /sebelum data dasar terbit/i);
});
