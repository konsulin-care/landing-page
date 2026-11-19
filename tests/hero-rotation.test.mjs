import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as rotation from '../assets/js/hero-rotation.js';
import { ROTATION_MS, TICK_MS, SWIPE_PX, heroSync } from '../assets/js/hero-rotation.js';

/** Builds a fake environment that records interval registrations. */
function makeEnv({ reducedMotion = false, hidden = false } = {}) {
  const timers = [];
  const doc = { hidden };
  const win = {
    matchMedia: () => ({ matches: reducedMotion }),
  };
  const every = (fn, ms) => {
    timers.push({ fn, ms });
    return timers.length;
  };
  return { env: { window: win, document: doc, setInterval: every }, timers, doc };
}

test('heroSync ticks raise progress and advance one pair after a full rotation', () => {
  const { env, timers } = makeEnv();
  const data = heroSync(3, env);
  data.init();

  assert.equal(TICK_MS, 100);
  assert.equal(data.i, 1);
  assert.equal(data.progress(), 0);

  timers[0].fn();
  assert.ok(data.progress() > 0 && data.progress() < 1);

  for (let tick = 1; tick < ROTATION_MS / TICK_MS; tick += 1) timers[0].fn();
  assert.equal(data.i, 2);
  assert.equal(data.elapsed, 0);
});

test('heroSync holds all ticks while any reason is held or the document is hidden', () => {
  const { env, timers, doc } = makeEnv();
  const data = heroSync(3, env);
  data.init();

  data.hold('hover');
  data.hold('focus');
  data.hold('hover');
  assert.deepEqual(data.holds, ['hover', 'focus']);

  timers[0].fn();
  assert.equal(data.i, 1);
  assert.equal(data.elapsed, 0);

  data.release('hover');
  timers[0].fn();
  assert.equal(data.i, 1);
  assert.equal(data.elapsed, 0);

  data.release('focus');
  assert.equal(data.paused, false);
  timers[0].fn();
  assert.equal(data.elapsed, TICK_MS);

  doc.hidden = true;
  timers[0].fn();
  assert.equal(data.elapsed, TICK_MS);
});

test('heroSync under reduced motion registers no interval and is complete', () => {
  const { env, timers } = makeEnv({ reducedMotion: true });
  const data = heroSync(3, env);
  data.init();

  assert.equal(timers.length, 0);
  assert.equal(data.cycled, true);
  assert.equal(data.progress(), 1);
});

test('heroSync select sets the active pair and resets elapsed', () => {
  const { env } = makeEnv();
  const data = heroSync(3, env);

  data.elapsed = TICK_MS * 3;
  data.select(2);

  assert.equal(data.i, 2);
  assert.equal(data.elapsed, 0);
});

test('heroSync next and prev move modulo n and reset elapsed', () => {
  const { env } = makeEnv();
  const data = heroSync(3, env);

  data.elapsed = TICK_MS;
  data.next();
  assert.equal(data.i, 2);
  assert.equal(data.elapsed, 0);

  data.elapsed = TICK_MS;
  data.prev();
  assert.equal(data.i, 1);
  assert.equal(data.elapsed, 0);

  data.select(0);
  data.prev();
  assert.equal(data.i, 2);
  data.next();
  assert.equal(data.i, 0);
});

test('heroSync swipe advances or rewinds only past the threshold', () => {
  const { env } = makeEnv();
  const data = heroSync(3, env);

  assert.equal(SWIPE_PX, 40);

  data.swipeStart(100);
  data.swipeEnd(100 - SWIPE_PX);
  assert.equal(data.i, 2);

  data.swipeStart(100);
  data.swipeEnd(100 + SWIPE_PX);
  assert.equal(data.i, 1);

  data.swipeStart(100);
  data.swipeEnd(100 - SWIPE_PX + 1);
  assert.equal(data.i, 1);

  data.swipeStart(100);
  data.swipeEnd(100 + SWIPE_PX - 1);
  assert.equal(data.i, 1);
});

test('heroSync swipeEnd without a start is a no-op', () => {
  const { env } = makeEnv();
  const data = heroSync(3, env);

  data.swipeEnd(0);
  assert.equal(data.i, 1);
});

test('heroSync cycled becomes true once every pair has been active', () => {
  const { env } = makeEnv();
  const data = heroSync(3, env);
  data.init();

  assert.equal(data.cycled, false);
  data.next();
  assert.equal(data.cycled, false);
  data.next();
  assert.equal(data.cycled, true);

  data.select(1);
  assert.equal(data.cycled, true);
});

test('heroSync openGloss holds the clock while the gloss stays open', () => {
  const { env, timers } = makeEnv();
  const data = heroSync(3, env);
  data.init();

  data.openGloss(2);
  assert.equal(data.gloss, 2);
  assert.deepEqual(data.holds, ['gloss']);

  timers[0].fn();
  assert.equal(data.i, 1);
  assert.equal(data.elapsed, 0);
});

test('heroSync openGloss switches the gloss without stacking holds', () => {
  const { env } = makeEnv();
  const data = heroSync(3, env);

  data.openGloss(0);
  data.openGloss(2);
  assert.equal(data.gloss, 2);
  assert.deepEqual(data.holds, ['gloss']);
});

test('heroSync closeGloss releases the hold so ticks advance again', () => {
  const { env, timers } = makeEnv();
  const data = heroSync(3, env);
  data.init();

  data.openGloss(1);
  timers[0].fn();
  assert.equal(data.elapsed, 0);

  data.closeGloss();
  assert.equal(data.gloss, null);
  assert.deepEqual(data.holds, []);
  timers[0].fn();
  assert.equal(data.elapsed, TICK_MS);
});

test('heroSync automatic advances count towards cycled', () => {
  const { env, timers } = makeEnv();
  const data = heroSync(3, env);
  data.init();

  for (let tick = 0; tick < ROTATION_MS / TICK_MS; tick += 1) timers[0].fn();
  assert.equal(data.i, 2);
  assert.equal(data.cycled, false);

  for (let tick = 0; tick < ROTATION_MS / TICK_MS; tick += 1) timers[0].fn();
  assert.equal(data.i, 0);
  assert.equal(data.cycled, true);
});

/** Lists every file below a directory, recursively. */
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

test('legacy heroRotation factory and global are gone', () => {
  assert.equal(typeof rotation.heroSync, 'function');
  assert.equal('heroRotation' in rotation, false);

  const layouts = fileURLToPath(new URL('../layouts/', import.meta.url));
  for (const file of listFiles(layouts)) {
    const source = readFileSync(file, 'utf8');
    assert.equal(source.includes('jtHeroRotation'), false, `${file} references jtHeroRotation`);
  }
});
