// Hero dot field wiring: script delivery, reduced-motion behaviour and the
// caption lifecycle driven by pointer events on the canvas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readBuilt } from './helpers/build.mjs';
import { mountField } from '../assets/js/resilience-field.js';

const CAPTIONS = {
  idle: 'Sentuh atau arahkan kursor ke sini',
  pressed: 'Tertekan…',
  recovering: 'Memulihkan diri…',
  settled: 'Kembali seimbang',
};

/**
 * Reads an HTML attribute from an opening tag, accepting quoted and unquoted
 * (minified) values.
 * @param {string} tag opening tag markup
 * @param {string} name attribute name
 * @returns {string|undefined} attribute value, or undefined when absent
 */
function attribute(tag, name) {
  const pattern = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

/**
 * Builds a fake canvas plus 2D context that records drawing calls.
 * @returns {{ canvas: object, ctx: object, calls: Array<Array<unknown>>, emit: Function }} canvas harness
 */
function makeCanvas() {
  const calls = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    clearRect: (...args) => calls.push(['clearRect', ...args]),
    beginPath: () => calls.push(['beginPath']),
    arc: (...args) => calls.push(['arc', ...args]),
    fill: () => calls.push(['fill']),
    stroke: () => calls.push(['stroke']),
    setTransform: (...args) => calls.push(['setTransform', ...args]),
  };

  let held = null;
  const listeners = new Map();
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 250 }),
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type) => listeners.delete(type),
  };

  const emit = (type, event) => {
    held = type;
    const handler = listeners.get(type);
    if (handler) handler({ pointerType: 'touch', clientX: 200, clientY: 125, ...event });
    return held;
  };

  return { canvas, ctx, calls, emit, listeners };
}

/**
 * Builds a fake `[data-jt-field]` root carrying a canvas and caption span.
 * @param {Record<string, string>} captions caption strings keyed by state
 * @returns {{ root: object, canvas: object, emit: Function, caption: object }} root harness
 */
function makeRoot(captions = CAPTIONS) {
  const harness = makeCanvas();
  const caption = {
    textContent: captions.idle,
    getAttribute(name) {
      const key = name.replace(/^data-/, '');
      return captions[key] ?? null;
    },
  };
  const root = {
    querySelector(selector) {
      if (selector === 'canvas') return harness.canvas;
      if (selector === '[data-jt-field-caption]') return caption;
      return null;
    },
  };
  return { root, canvas: harness.canvas, emit: harness.emit, caption };
}

/**
 * Builds a fake environment with a controllable rAF queue and observers.
 * @param {{ reducedMotion?: boolean }} [options] harness options
 * @returns {object} fake environment and drivers
 */
function makeEnv({ reducedMotion = false } = {}) {
  const queue = [];
  const observers = { intersection: [], resize: [] };
  let id = 0;
  let clock = 0;
  let requests = 0;

  const requestAnimationFrame = (callback) => {
    requests += 1;
    id += 1;
    queue.push({ id, callback });
    return id;
  };

  const now = () => clock;

  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      observers.intersection.push(this);
    }
    observe(target) {
      this.target = target;
    }
    disconnect() {}
  }

  class FakeResizeObserver {
    constructor(callback) {
      this.callback = callback;
      observers.resize.push(this);
    }
    observe(target) {
      this.target = target;
    }
    disconnect() {}
  }

  const env = {
    window: {
      matchMedia: () => ({ matches: reducedMotion }),
      devicePixelRatio: 2,
    },
    requestAnimationFrame,
    now,
    IntersectionObserver: FakeIntersectionObserver,
    ResizeObserver: FakeResizeObserver,
  };

  const runFrames = (count = 1) => {
    let ran = 0;
    for (let index = 0; index < count && queue.length > 0; index += 1) {
      const next = queue.shift();
      clock += 16;
      next.callback(clock);
      ran += 1;
    }
    return ran;
  };

  const drain = (limit = 5000) => {
    let ran = 0;
    while (queue.length > 0 && ran < limit) {
      runFrames(1);
      ran += 1;
    }
    return ran;
  };

  return {
    env,
    queue,
    observers,
    runFrames,
    drain,
    requests: () => requests,
    pending: () => queue.length,
    advance: (ms) => {
      clock += ms;
    },
  };
}

test('the built homepage loads resilience-field.js as a deferred, fingerprinted script', () => {
  const { status, output } = buildSite();
  assert.equal(status, 0, output);
  const html = readBuilt('index.html');

  const tags = [...html.matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
  const tag = tags.find((candidate) => (attribute(candidate, 'src') ?? '').includes('resilience-field'));
  assert.ok(tag, 'the homepage references resilience-field.js');
  assert.match(attribute(tag, 'src') ?? '', /resilience-field\.[^/]+\.js$/, 'the script is fingerprinted');
  assert.match(attribute(tag, 'integrity') ?? '', /^sha256-/, 'the script carries an integrity hash');
  assert.match(tag, /\sdefer\b/i, 'the script defers');
});

test('mountField under reduced motion requests no animation frame', () => {
  const { root } = makeRoot();
  const harness = makeEnv({ reducedMotion: true });

  const controller = mountField(root, harness.env);

  assert.equal(controller, null);
  assert.equal(harness.requests(), 0, 'no frame is requested');
  assert.equal(harness.pending(), 0);
});

test('with motion the loop stops requesting frames once settled and nothing is active', () => {
  const { root, caption } = makeRoot();
  const harness = makeEnv();

  mountField(root, harness.env);
  harness.observers.intersection[0].callback([{ isIntersecting: true }]);
  assert.ok(harness.pending() > 0, 'the first view starts the ghost sweep');

  harness.drain();
  assert.equal(harness.pending(), 0, 'the loop stops once the field settles');

  const before = harness.requests();
  assert.equal(harness.runFrames(5), 0, 'no frame callback remains queued');
  assert.equal(harness.requests(), before, 'no further frames are requested');
  assert.equal(caption.textContent, CAPTIONS.idle, 'an untouched settled field reads idle');
});

test('pointerdown presses the field and releasing recovers then settles', () => {
  const { root, emit, caption } = makeRoot();
  const harness = makeEnv();

  mountField(root, harness.env);
  harness.observers.intersection[0].callback([{ isIntersecting: true }]);
  harness.drain();

  emit('pointerdown');
  assert.equal(caption.textContent, CAPTIONS.pressed, 'pointerdown shows the pressed caption');

  harness.runFrames(20);
  assert.equal(caption.textContent, CAPTIONS.pressed, 'holding keeps the pressed caption');

  emit('pointerup');
  assert.equal(caption.textContent, CAPTIONS.recovering, 'release shows the recovering caption');

  harness.drain();
  assert.equal(caption.textContent, CAPTIONS.settled, 'the field settles back to balanced');
  assert.equal(harness.pending(), 0, 'the loop stops after settling');
});
