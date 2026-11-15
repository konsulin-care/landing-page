// Consistency tests for the Node 26 / CI contract finalized in the
// landing page repo. Each test maps 1:1 to a definition of done in the
// implementation plan:
//   U1 .nvmrc pins Node 26
//   U2 workflows read .nvmrc and install via pnpm frozen lockfile
//   U3 package.json declares the Node engines floor
//   U4 cloudflare.md aligns to Node 26, no stale 18.16.0 anywhere
//   U5 dependabot.yml covers npm + github-actions, monthly
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

test('U1: .nvmrc pins Node major version 26', () => {
  assert.ok(exists('.nvmrc'), '.nvmrc must exist');
  assert.equal(read('.nvmrc'), '26\n', 'exactly "26" with trailing newline');
});

test('U2: workflows read .nvmrc and install with pnpm frozen lockfile', () => {
  const workflows = [
    '.github/workflows/render.yml',
    '.github/workflows/pull-request.yml',
  ];
  for (const wf of workflows) {
    assert.ok(exists(wf), `${wf} must exist`);
    const content = read(wf);
    assert.ok(
      content.includes('node-version-file: .nvmrc'),
      `${wf} must use node-version-file: .nvmrc`,
    );
    assert.ok(
      !content.includes('node-version:'),
      `${wf} must not hardcode node-version:`,
    );
    assert.ok(
      content.includes('run: pnpm install --frozen-lockfile'),
      `${wf} must install with pnpm install --frozen-lockfile`,
    );
    assert.ok(
      content.includes('run: pnpm run build'),
      `${wf} must build with pnpm run build`,
    );
    // Note: never assert absence of the bare "npm install" text here —
    // "pnpm install" contains it as a substring. Assert on the step
    // prefix instead: no step may run an npm command.
    assert.ok(
      !content.includes('run: npm'),
      `${wf} must contain no "run: npm" steps`,
    );
  }
});

test('U3: package.json declares engines.node >= 20.6', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.engines?.node, '>=20.6');
});

test('U4: cloudflare.md aligns Node 26, no 18.16.0 anywhere in repo', () => {
  assert.ok(
    read('cloudflare.md').includes('NODE_VERSION=26.0.0'),
    'cloudflare.md must set NODE_VERSION=26.0.0',
  );
  assert.ok(
    !read('cloudflare.md').includes('18.16.0'),
    'cloudflare.md must not reference NODE_VERSION=18.16.0',
  );

  // No 18.16.0 may remain anywhere in the repo (excluding vendored dirs
  // and the test harness, which necessarily references the stale value).
  const offenders = [];
  const skipDirs = new Set(['.git', 'node_modules', 'public', 'tests', '.pi', 'resources']);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) walk(p);
      } else {
        let content;
        try {
          content = fs.readFileSync(p, 'utf8');
        } catch {
          continue; // binary/unreadable file, skip
        }
        if (content.includes('18.16.0')) {
          offenders.push(path.relative(ROOT, p));
        }
      }
    }
  };
  walk(ROOT);
  assert.deepEqual(offenders, [], 'no file may reference 18.16.0');
});

test('U2b: hugo allows postcss native addons and workers under node permission model', () => {
  // Hugo's node wrapper runs postcss with --permission; without
  // --allow-addons / --allow-worker Node blocks dlopen and worker_threads,
  // both used by @tailwindcss/oxide + lightningcss.
  const hugoConfig = read('hugo.yaml');
  const fromPermissions = hugoConfig.indexOf('permissions:');
  assert.ok(fromPermissions !== -1, 'hugo.yaml must define security.node.permissions');
  const section = hugoConfig.slice(fromPermissions);
  const keys = ['allowAddons:', 'allowWorker:', 'allowChildProcess:'];
  for (const key of keys) {
    assert.ok(section.includes(key), `hugo.yaml must set ${key}`);
  }
  const postcssOccurrences = (section.match(/- postcss/g) ?? []).length;
  assert.ok(
    postcssOccurrences >= 3,
    'postcss must be allow-listed in each permissions list (addons, worker, child-process)',
  );
});

test('T3: site language is Indonesian', () => {
  const cfg = read('hugo.yaml');
  assert.match(cfg, /^locale: id-ID$/m);
  assert.match(cfg, /^DefaultContentLanguage: id$/m);
  assert.ok(!/^\s*languageCode\s*:/m.test(cfg), 'no languageCode key');
  const en = read('i18n/en.toml');
  const id = read('i18n/id.toml');
  assert.ok(en.includes('[wordCount]') && id.includes('[wordCount]'));
  assert.match(id, /^other = "\{\{ \.WordCount \}\} kata"$/m);
  assert.ok(read('layouts/partials/meta.html').includes('og:locale" content="id_ID"'));
});

test('T4: SEO keywords are clean', () => {
  const cfg = read('hugo.yaml');
  const block = cfg.match(/^ {2}keywords:\n((?: {4}- .*\n)+)/m);
  assert.ok(block, 'keywords list must exist');
  const kws = block[1].split('\n').filter(Boolean).map((l) => l.replace(/^ +- /, '').trim());
  for (const bad of [
    'dokter psikolog',
    'dokter psikiater',
    'psikiater',
    'psikiatri',
    'psikolog online',
    'konsultasi psikolog online',
    'aplikasi kesehatan jiwa',
  ]) {
    assert.ok(!kws.includes(bad), `keywords must not include ${bad}`);
  }
  assert.equal(kws.filter((k) => k === 'kesehatan mental').length, 1);
  for (const good of ['resiliensi', 'ketangguhan psikologis', 'JadiTangguh', 'citizen science', 'riset kesehatan partisipatif']) {
    assert.ok(kws.includes(good), `keywords must include ${good}`);
  }
});

test('U5: dependabot.yml covers npm + github-actions at monthly', () => {
  const file = '.github/dependabot.yml';
  assert.ok(exists(file), `${file} must exist`);
  const content = read(file);
  assert.ok(content.includes('version: 2'), 'dependabot version 2');
  assert.ok(content.includes('package-ecosystem: npm'), 'npm ecosystem');
  assert.ok(
    content.includes('package-ecosystem: github-actions'),
    'github-actions ecosystem',
  );
  assert.ok(
    content.includes('directory: "/"'),
    'updates must target the repo root',
  );
  assert.ok(
    content.includes('interval: monthly'),
    'npdate cadence must be monthly',
  );
});
