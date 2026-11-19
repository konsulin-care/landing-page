import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/** Absolute path to the repository root. */
export const ROOT = path.resolve(import.meta.dirname, '..', '..');

/** In-process memo so repeated calls never rerun Hugo. */
let memo = null;

/**
 * Reads the start time of the parent process from /proc.
 * The start time makes the cache key unique even when a PID is recycled.
 * @returns {string|null} field 22 of /proc/<ppid>/stat, or null when unavailable
 */
function parentStartTime() {
  try {
    const stat = fs.readFileSync(`/proc/${process.ppid}/stat`, 'utf8');
    const close = stat.lastIndexOf(')');
    if (close < 0) return null;
    const fields = stat.slice(close + 2).trim().split(/\s+/);
    return fields[19] ?? null;
  } catch {
    return null;
  }
}

/**
 * Builds the shared cache key for this test run.
 * @returns {string} `${ppid}-${starttime}`, or just the ppid when /proc is unavailable
 */
function cacheKey() {
  const startTime = parentStartTime();
  return startTime ? `${process.ppid}-${startTime}` : `${process.ppid}`;
}

/**
 * Returns the on-disk build destination shared by this test run.
 * The destination always lives outside the repository so public/ stays clean.
 * @returns {string} absolute temp directory for the Hugo build
 */
export function buildDestination() {
  return path.join(os.tmpdir(), `landing-page-build-${cacheKey()}`);
}

/**
 * Runs one cached production Hugo build for the current test run.
 * The result is memoized in-process and persisted in `<dest>/.build-result.json`
 * so other test files in the same run reuse it instead of invoking Hugo again.
 * @returns {{ dest: string, status: number|null, output: string }} build destination, exit status and combined output
 */
export function buildSite() {
  if (memo) return memo;

  const dest = buildDestination();
  const resultFile = path.join(dest, '.build-result.json');

  if (fs.existsSync(resultFile)) {
    const cached = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    memo = { dest, status: cached.status, output: cached.output };
    return memo;
  }

  const result = spawnSync('hugo', ['--minify', '--destination', dest], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60000,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const record = { status: result.status, output };

  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(resultFile, JSON.stringify(record));
  memo = { dest, ...record };
  return memo;
}

/**
 * Reads a file from the shared Hugo build destination.
 * @param {string} rel path relative to the build destination, or an absolute path
 * @returns {string} file contents as UTF-8
 */
export function readBuilt(rel) {
  const { dest } = buildSite();
  return fs.readFileSync(path.isAbsolute(rel) ? rel : path.join(dest, rel), 'utf8');
}
