// Consistency tests for the Node 26 / CI contract finalized in the
// landing page repo. Each test maps 1:1 to a definition of done in the
// implementation plan:
//   U1 .nvmrc pins Node 26
//   U2 workflows read .nvmrc and install via lockfile (npm ci)
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

test('U2: workflows read .nvmrc and install with npm ci', () => {
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
      content.includes('run: npm ci'),
      `${wf} must install with npm ci`,
    );
    assert.ok(
      !content.includes('npm install'),
      `${wf} must not use npm install`,
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
  const skipDirs = new Set(['.git', 'node_modules', 'public', 'tests']);
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