import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(import.meta.dirname, '..');

function build() {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'research-'));
  const r = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  return { dest, r, out: `${r.stdout}${r.stderr}` };
}

test('research list builds with no Hugo warnings', () => {
  const { r, out } = build();
  assert.equal(r.status, 0, out);
  assert.ok(!/WARN/.test(out), out);
});

test('research list renders a card per study with title, summary, badge, link', () => {
  const { dest } = build();
  const html = fs.readFileSync(path.join(dest, 'research/index.html'), 'utf8');
  const cards = html.match(/data-study-card/g) ?? [];
  assert.equal(cards.length, 1);
  assert.ok(html.includes('JadiTangguh'));
  assert.ok(html.includes('data-study-status'));
  assert.match(html, /href="?(https:\/\/konsulin\.care)?\/research\/jadi-tangguh\/"?[ >]/);
});

test('research list renders the upcoming status label', () => {
  const { dest } = build();
  const html = fs.readFileSync(path.join(dest, 'research/index.html'), 'utf8');
  assert.match(html, /data-study-status[^>]*>\s*Segera dibuka\s*</);
});

test('upcoming study shows the badge but hides the study CTA', () => {
  const { dest } = build();
  const html = fs.readFileSync(path.join(dest, 'research/jadi-tangguh/index.html'), 'utf8');
  assert.match(html, /data-study-status[^>]*>\s*Segera dibuka\s*</);
  assert.ok(!html.includes('data-study-cta'), html);
  assert.ok(!html.includes('https://app.konsulin.care/research'), html);
});

test('research pages contain no TODO(maintainer) placeholders', () => {
  const { dest } = build();
  const list = fs.readFileSync(path.join(dest, 'research/index.html'), 'utf8');
  const study = fs.readFileSync(path.join(dest, 'research/jadi-tangguh/index.html'), 'utf8');
  assert.ok(!list.includes('TODO(maintainer)'), list);
  assert.ok(!study.includes('TODO(maintainer)'), study);
});

test('study page renders the summary, question and team from front matter', () => {
  const source = fs.readFileSync(path.join(ROOT, 'content/research/jadi-tangguh.md'), 'utf8');
  const field = (key) => {
    const m = source.match(new RegExp(`^${key}:\\s*"(.*)"$`, 'm'));
    assert.ok(m, `${key} should be set in front matter`);
    return m[1];
  };
  const { dest } = build();
  const html = fs.readFileSync(path.join(dest, 'research/jadi-tangguh/index.html'), 'utf8');
  for (const key of ['summary', 'question', 'team']) {
    assert.ok(html.includes(field(key)), `${key} renders on the study page`);
  }
});

test('study page renders the ethics status verbatim', () => {
  const source = fs.readFileSync(path.join(ROOT, 'content/research/jadi-tangguh.md'), 'utf8');
  const match = source.match(/^ethics_status:\s*"(.*)"$/m);
  assert.ok(match, 'ethics_status should be set in front matter');
  const { dest } = build();
  const html = fs.readFileSync(path.join(dest, 'research/jadi-tangguh/index.html'), 'utf8');
  assert.ok(html.includes(match[1]), html);
});
