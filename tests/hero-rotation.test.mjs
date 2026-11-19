import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROTATION_MS, TICK_MS, heroRotation, heroSync } from '../assets/js/hero-rotation.js';

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

test('init starts a 5500 ms interval', () => {
  const { env, timers } = makeEnv();
  heroRotation(3, env).init();

  assert.equal(ROTATION_MS, 5500);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, ROTATION_MS);
});

test('each tick advances the active line modulo n', () => {
  const { env, timers } = makeEnv();
  const data = heroRotation(3, env);
  data.init();

  assert.equal(data.i, 1);
  timers[0].fn();
  assert.equal(data.i, 2);
  timers[0].fn();
  assert.equal(data.i, 0);
  timers[0].fn();
  assert.equal(data.i, 1);
});

test('ticks do not advance while the document is hidden', () => {
  const { env, timers, doc } = makeEnv();
  const data = heroRotation(3, env);
  data.init();

  doc.hidden = true;
  timers[0].fn();
  assert.equal(data.i, 1);
});

test('ticks do not advance while paused', () => {
  const { env, timers } = makeEnv();
  const data = heroRotation(3, env);
  data.init();

  data.paused = true;
  timers[0].fn();
  assert.equal(data.i, 1);

  data.paused = false;
  timers[0].fn();
  assert.equal(data.i, 2);
});

test('reduced motion starts no interval at all', () => {
  const { env, timers } = makeEnv({ reducedMotion: true });
  heroRotation(3, env).init();

  assert.equal(timers.length, 0);
});

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
