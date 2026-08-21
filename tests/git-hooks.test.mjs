// Contract tests for the git-hook gating setup (husky + node --test).
// Each test maps 1:1 to a definition of done in the implementation plan:
//   H1  package.json "test" runs the real suite via node --test
//   H2  package.json "prepare" activates husky on install
//   H3  husky is a devDependency
//   H4  .husky/pre-commit exists, is executable, and blocks on failed tests
//   H5  .husky/pre-push exists, is executable, and blocks on failed tests
//   H6  .gitignore ignores the generated .husky/_ shims
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const isExecutable = (rel) => (fs.statSync(path.join(ROOT, rel)).mode & 0o111) !== 0;

test('H1: npm test runs the real suite via node --test (serial to avoid Hugo build races)', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.test, 'node --test --test-concurrency=1');
});

test('H2: prepare activates husky on every install', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.prepare, 'husky');
});

test('H3: husky is a devDependency', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.devDependencies?.husky, 'husky must be a devDependency');
});

test('H4: pre-commit hook exists, is executable, and gates on npm test', () => {
  assert.ok(exists('.husky/pre-commit'), '.husky/pre-commit must exist');
  assert.ok(isExecutable('.husky/pre-commit'), '.husky/pre-commit must be executable');
  const hook = read('.husky/pre-commit');
  assert.ok(hook.includes('npm test'), 'hook must run npm test');
  assert.ok(hook.includes('commit blocked'), 'hook must report commit blocked');
});

test('H5: pre-push hook exists, is executable, and gates on npm test', () => {
  assert.ok(exists('.husky/pre-push'), '.husky/pre-push must exist');
  assert.ok(isExecutable('.husky/pre-push'), '.husky/pre-push must be executable');
  const hook = read('.husky/pre-push');
  assert.ok(hook.includes('npm test'), 'hook must run npm test');
  assert.ok(hook.includes('push blocked'), 'hook must report push blocked');
});

test('H6: .husky/_ generated shims are gitignored', () => {
  assert.ok(read('.gitignore').includes('.husky/_'), '.gitignore must ignore .husky/_');
});
