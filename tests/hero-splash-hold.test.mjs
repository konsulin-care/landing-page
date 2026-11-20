import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heroSync } from '../assets/js/hero-rotation.js';
import { SPLASH_CLASS, SPLASH_DONE_EVENT } from '../assets/js/splash-state.js';

/** Builds a fake environment whose document root may carry the splash class. */
function makeEnv({ splash = true, reducedMotion = false } = {}) {
  const timers = [];
  const listeners = [];
  const classes = new Set(splash ? [SPLASH_CLASS] : []);
  const root = {
    classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
  };
  const doc = { hidden: false, documentElement: root };
  const win = {
    matchMedia: () => ({ matches: reducedMotion }),
    addEventListener: (type, fn, options) => {
      listeners.push({ type, fn, options });
    },
  };
  const every = (fn, ms) => {
    timers.push({ fn, ms });
    return timers.length;
  };
  return { env: { window: win, document: doc, setInterval: every }, timers, listeners, classes };
}

/** Dispatches a recorded window listener of the given type. */
function dispatch(listeners, type) {
  for (const listener of listeners.filter((entry) => entry.type === type)) listener.fn({ type });
}

test('heroSync init holds the clock with reason splash when the html element has jt-splash', () => {
  const { env, timers } = makeEnv({ splash: true });
  const data = heroSync(3, {}, env);
  data.init();

  assert.ok(data.holds.includes('splash'), 'splash hold is registered on init');
  assert.equal(data.paused, true);

  timers[0].fn();
  assert.equal(data.elapsed, 0, 'ticks do not advance while the splash holds');
  assert.equal(data.i, 0);
});

test('dispatching jt-splash-done on the window releases the splash hold and ticks advance again', () => {
  const { env, timers, listeners } = makeEnv({ splash: true });
  const data = heroSync(3, {}, env);
  data.init();

  const done = listeners.find((entry) => entry.type === SPLASH_DONE_EVENT);
  assert.ok(done, 'init registers a jt-splash-done listener');
  assert.equal(done.options?.once, true, 'the listener fires once');

  timers[0].fn();
  assert.equal(data.elapsed, 0);

  dispatch(listeners, SPLASH_DONE_EVENT);
  assert.equal(data.holds.includes('splash'), false, 'the splash hold is released');

  timers[0].fn();
  assert.equal(data.elapsed, 100, 'ticks advance after the splash finishes');
});

test('heroSync init adds no splash hold when the html element lacks jt-splash', () => {
  const { env, timers, listeners } = makeEnv({ splash: false });
  const data = heroSync(3, {}, env);
  data.init();

  assert.deepEqual(data.holds, []);
  assert.equal(data.paused, false);
  assert.equal(listeners.length, 0, 'no splash listener is registered');

  timers[0].fn();
  assert.equal(data.elapsed, 100);
});

test('heroSync under reduced motion registers no interval and no splash hold', () => {
  const { env, timers, listeners } = makeEnv({ splash: true, reducedMotion: true });
  const data = heroSync(3, {}, env);
  data.init();

  assert.equal(timers.length, 0);
  assert.deepEqual(data.holds, []);
  assert.equal(listeners.length, 0);
});
