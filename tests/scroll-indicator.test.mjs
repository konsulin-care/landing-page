// Scroll indicator state: shows while the page scrolls, hides 800ms after the
// last scroll event, and sizes the thumb from the scrollable ratio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HIDE_MS, MIN_THUMB_PX, scrollIndicator } from '../assets/js/scroll-indicator.js';

/**
 * Builds a fake window/document pair plus a recording timer set.
 * @param {{ innerHeight?: number, scrollHeight?: number, scrollY?: number }} [metrics] viewport metrics
 * @returns {{ env: object, timers: Array<{ id: number, fn: () => void, ms: number, cleared: boolean }> }} fake environment
 */
function makeEnv({ innerHeight = 800, scrollHeight = 4000, scrollY = 0 } = {}) {
  const timers = [];
  const win = {
    innerHeight,
    scrollY,
    listeners: [],
    addEventListener(type, fn, options) {
      this.listeners.push({ type, fn, options });
    },
  };
  const doc = { documentElement: { scrollHeight }, body: {} };
  const env = {
    window: win,
    document: doc,
    setTimeout: (fn, ms) => {
      timers.push({ id: timers.length + 1, fn, ms, cleared: false });
      return timers.length;
    },
    clearTimeout: (id) => {
      const timer = timers.find((entry) => entry.id === id);
      if (timer) timer.cleared = true;
    },
    ResizeObserver: class {
      constructor() {
        this.observed = [];
      }
      observe(target) {
        this.observed.push(target);
      }
    },
  };
  return { env, timers, win, doc };
}

/** Runs every timer that has not been cleared, newest first is not needed here. */
function firePending(timers) {
  for (const timer of timers.filter((entry) => !entry.cleared)) timer.fn();
}

test('scrolling shows the indicator and it hides 800ms after the last scroll', () => {
  const { env, timers } = makeEnv();
  const data = scrollIndicator({}, env);

  data.onScroll();
  assert.equal(data.visible, true, 'indicator must show on the first scroll');
  const first = timers.at(-1);
  assert.equal(first.ms, HIDE_MS);
  assert.equal(first.cleared, false);

  data.onScroll();
  assert.equal(first.cleared, true, 'a second scroll must clear the pending hide timer');
  const second = timers.at(-1);
  assert.notEqual(second.id, first.id);

  firePending(timers);
  assert.equal(data.visible, false, 'indicator must hide once the idle timer fires');
});

test('measure sizes and offsets the thumb from the scroll ratio', () => {
  const { env, win } = makeEnv({ innerHeight: 800, scrollHeight: 4000 });
  const data = scrollIndicator({}, env);

  data.measure();
  assert.equal(data.thumb, Math.max(MIN_THUMB_PX, Math.round((800 * 800) / 4000)));
  assert.equal(data.offset, 0);

  win.scrollY = 1600;
  data.measure();
  assert.equal(data.offset, Math.round((1600 / (4000 - 800)) * (800 - data.thumb)));

  win.scrollY = 4000 - 800;
  data.measure();
  assert.equal(data.offset, 800 - data.thumb, 'thumb must sit at the track bottom');
});

test('a page that does not scroll never shows a thumb', () => {
  const { env } = makeEnv({ innerHeight: 800, scrollHeight: 800 });
  const data = scrollIndicator({}, env);

  data.onScroll();
  assert.equal(data.thumb, 0);
  assert.equal(data.visible, false, 'no thumb means the indicator stays hidden');
});
