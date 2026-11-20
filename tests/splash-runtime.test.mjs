// Splash runtime: start gates the splash, dock moves the real lockup, and
// cleanup tears everything down and announces completion exactly once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPLASH_CLASS,
  SPLASH_RUN_CLASS,
  SPLASH_DONE_EVENT,
  SPLASH_FALLBACK_MS,
  VEIL_ANIMATION,
} from '../assets/js/splash-state.js';
import { start, dock, cleanup } from '../assets/js/splash.js';

/**
 * Builds a fake environment for the splash runtime with Set-backed classes, a
 * style map, recorded listeners, recorded timers and recorded events.
 * @param {{ reducedMotion?: boolean, hash?: string, referrer?: string, keySet?: boolean, rect?: { left: number, top: number, width: number, height: number }, width?: number, height?: number, noLogo?: boolean, noCustomEvent?: boolean }} [opts] environment options
 * @returns {object} fake environment plus inspection helpers
 */
function makeEnv({
  reducedMotion = false,
  hash = '',
  referrer = '',
  keySet = false,
  rect = { left: 24, top: 20, width: 120, height: 40 },
  width = 1280,
  height = 800,
  noLogo = false,
  noCustomEvent = false,
} = {}) {
  const classes = new Set();
  const styleValues = new Map();
  const listeners = new Map();
  const timers = [];
  const cleared = [];
  const events = [];
  const store = new Map(keySet ? [['jt-splash-seen', '1']] : []);

  class FakeEvent {
    constructor(type) {
      this.type = type;
    }
  }
  class FakeCustomEvent extends FakeEvent {}

  const style = {
    setProperty(name, value) {
      styleValues.set(name, value);
    },
    removeProperty(name) {
      styleValues.delete(name);
    },
  };

  const documentElement = {
    classList: classes,
    style,
    clientWidth: width,
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    removeEventListener(type, fn) {
      if (listeners.get(type) === fn) listeners.delete(type);
    },
  };

  const logo = {
    getBoundingClientRect: () => rect,
  };

  const doc = {
    documentElement,
    referrer,
    querySelector: (selector) => (noLogo ? null : selector === '[data-splash-logo]' ? logo : null),
  };

  const win = {
    matchMedia: () => ({ matches: reducedMotion }),
    location: { hash, origin: 'https://konsulin.care' },
    sessionStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, value),
    },
    innerHeight: height,
    Event: FakeEvent,
    dispatchEvent: (event) => events.push(event),
  };
  if (!noCustomEvent) win.CustomEvent = FakeCustomEvent;

  const env = {
    window: win,
    document: doc,
    listeners,
    timers,
    cleared,
    events,
    setTimeout: (fn, ms) => {
      const id = { fn, ms };
      timers.push(id);
      return id;
    },
    clearTimeout: (id) => {
      cleared.push(id);
    },
  };

  return { env, classes, styleValues, listeners, timers, cleared, events, logo };
}

test('start adds jt-splash and defines window.jtSplashDock when shouldPlay passes', () => {
  const { env, classes } = makeEnv();
  assert.equal(start(env), true);
  assert.equal(classes.has(SPLASH_CLASS), true);
  assert.equal(typeof env.window.jtSplashDock, 'function');
  assert.equal(env.listeners.has('animationend'), true);
  assert.equal(env.timers.length, 1);
  assert.equal(env.timers[0].ms, SPLASH_FALLBACK_MS);
});

test('start skips the splash and leaves the dock hook undefined when shouldPlay fails', () => {
  const { env, classes } = makeEnv({ reducedMotion: true });
  assert.equal(start(env), false);
  assert.equal(classes.has(SPLASH_CLASS), false);
  assert.equal(env.window.jtSplashDock, undefined);
  assert.equal(env.listeners.has('animationend'), false);
  assert.equal(env.timers.length, 0);
});

test('start skips when the key is already set for the tab session', () => {
  const { env, classes } = makeEnv({ keySet: true });
  assert.equal(start(env), false);
  assert.equal(classes.has(SPLASH_CLASS), false);
  assert.equal(env.window.jtSplashDock, undefined);
});

test('dock sets the three splash variables from the measured lockup and adds jt-splash-run', () => {
  const { env, classes, styleValues } = makeEnv();
  start(env);
  dock(env);
  const rect = { left: 24, top: 20, width: 120, height: 40 };
  const x = 1280 / 2 - (rect.left + rect.width / 2);
  const y = 800 / 2 - (rect.top + rect.height / 2);
  const scale = Math.max(1, Math.min(2, (0.6 * 1280) / rect.width));
  assert.equal(styleValues.get('--jt-splash-x'), `${x}px`);
  assert.equal(styleValues.get('--jt-splash-y'), `${y}px`);
  assert.equal(styleValues.get('--jt-splash-scale'), String(scale));
  assert.equal(classes.has(SPLASH_RUN_CLASS), true);
});

test('dock does nothing when the lockup is missing or the splash class is absent', () => {
  const missing = makeEnv({ noLogo: true });
  start(missing.env);
  dock(missing.env);
  assert.equal(missing.styleValues.size, 0);
  assert.equal(missing.classes.has(SPLASH_RUN_CLASS), false);

  const notStarted = makeEnv();
  dock(notStarted.env);
  assert.equal(notStarted.styleValues.size, 0);
  assert.equal(notStarted.classes.has(SPLASH_RUN_CLASS), false);
});

test('a matching animationend cleans up classes and properties and dispatches jt-splash-done once', () => {
  const { env, classes, styleValues, listeners, cleared, events } = makeEnv();
  start(env);
  dock(env);
  const listener = listeners.get('animationend');
  listener({ animationName: 'some-other-animation' });
  assert.equal(classes.has(SPLASH_CLASS), true);
  assert.equal(events.length, 0);

  listener({ animationName: VEIL_ANIMATION });
  assert.equal(classes.has(SPLASH_CLASS), false);
  assert.equal(classes.has(SPLASH_RUN_CLASS), false);
  assert.equal(styleValues.has('--jt-splash-x'), false);
  assert.equal(styleValues.has('--jt-splash-y'), false);
  assert.equal(styleValues.has('--jt-splash-scale'), false);
  assert.equal(listeners.has('animationend'), false);
  assert.equal(cleared.length, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, SPLASH_DONE_EVENT);
  assert.ok(events[0] instanceof env.window.CustomEvent);
});

test('the fallback timer cleans up and further cleanup calls stay idempotent', () => {
  const { env, classes, styleValues, timers, cleared, events } = makeEnv();
  start(env);
  dock(env);
  const timer = timers[0];
  timer.fn();
  assert.equal(classes.has(SPLASH_CLASS), false);
  assert.equal(classes.has(SPLASH_RUN_CLASS), false);
  assert.equal(styleValues.size, 0);
  assert.deepEqual(cleared, [timer]);
  assert.equal(events.length, 1);

  cleanup(env);
  cleanup(env);
  assert.equal(events.length, 1);
  assert.deepEqual(cleared, [timer]);
});

test('cleanup dispatches a plain Event when CustomEvent is unavailable', () => {
  const { env, events } = makeEnv({ noCustomEvent: true });
  start(env);
  cleanup(env);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, SPLASH_DONE_EVENT);
  assert.equal(events[0] instanceof env.window.Event, true);
});
