// Play-once viewport reveal: content stays visible under reduced motion or
// without IntersectionObserver, otherwise it hides and shows on first entry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reveal } from '../assets/js/reveal.js';
import { buildSite, readBuilt } from './helpers/build.mjs';

/**
 * Builds a fake environment with a matchMedia stub and a recording
 * IntersectionObserver class.
 * @param {{ reduce?: boolean, observer?: boolean }} [opts] fake capabilities; `reduce` makes the reduced-motion query match, `observer` false omits IntersectionObserver
 * @returns {{ env: object, observers: Array<{ targets: unknown[], options: object, disconnected: boolean, trigger: (entry: object) => void }> }} fake environment and the constructed observers
 */
function makeEnv({ reduce = false, observer = true } = {}) {
  const observers = [];
  const win = {
    matchMedia(query) {
      return { matches: reduce && query === '(prefers-reduced-motion: reduce)' };
    },
  };

  class FakeObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.targets = [];
      this.disconnected = false;
      observers.push(this);
    }

    observe(target) {
      this.targets.push(target);
    }

    disconnect() {
      this.disconnected = true;
    }

    trigger(entry) {
      this.callback([entry], this);
    }
  }

  const env = { window: win };
  if (observer) env.IntersectionObserver = FakeObserver;
  return { env, observers };
}

test('reveal stays visible without motion or observer support', () => {
  const reduced = makeEnv({ reduce: true });
  const data = reveal({}, reduced.env);
  data.$el = {};
  data.init();
  assert.equal(data.shown, true, 'reduced motion shows the final state immediately');
  assert.equal(reduced.observers.length, 0, 'no observer is constructed');

  const unsupported = makeEnv({ observer: false });
  const fallback = reveal({}, unsupported.env);
  fallback.$el = {};
  fallback.init();
  assert.equal(fallback.shown, true, 'a missing observer leaves the content visible');
});

test('reveal hides, then shows once on first entry and stops observing', () => {
  const { env, observers } = makeEnv();
  const data = reveal({}, env);
  const el = { id: 'target' };
  data.$el = el;

  assert.equal(data.shown, true, 'shown starts true so the markup renders visible');
  data.init();
  assert.equal(data.shown, false, 'motion-allowed init hides the element until it enters');
  assert.equal(observers.length, 1, 'exactly one observer is constructed');
  assert.deepEqual(observers[0].targets, [el], 'the Alpine element is observed');
  assert.equal(observers[0].options.threshold, 0.3, 'the default threshold applies');

  observers[0].trigger({ isIntersecting: false });
  assert.equal(data.shown, false, 'a non-intersecting entry keeps the element hidden');

  observers[0].trigger({ isIntersecting: true });
  assert.equal(data.shown, true, 'an intersecting entry reveals the element');
  assert.equal(observers[0].disconnected, true, 'the reveal plays once and stops observing');

  observers[0].trigger({ isIntersecting: true });
  assert.equal(data.shown, true, 'later entries do not change the state again');
});

test('the built homepage loads the reveal script before Alpine', () => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  const sources = [
    ...readBuilt('index.html').matchAll(/<script[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g),
  ].map((match) => match[1] ?? match[2] ?? match[3]);
  const revealAt = sources.findIndex((src) => src.includes('reveal'));
  const alpineAt = sources.findIndex((src) => src.includes('alpine'));
  assert.notEqual(revealAt, -1, 'the homepage must load the reveal script');
  assert.notEqual(alpineAt, -1, 'the homepage must load Alpine');
  assert.ok(revealAt < alpineAt, 'jtReveal must be registered before Alpine starts');
});
