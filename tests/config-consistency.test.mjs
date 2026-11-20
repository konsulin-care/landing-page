import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('hugo allows postcss native addons and workers under node permission model', () => {
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
