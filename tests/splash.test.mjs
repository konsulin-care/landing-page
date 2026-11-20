// Splash gate: plays once per tab session and skips under reduced motion,
// an in-page hash, a same-origin referrer or when sessionStorage is unusable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPLASH_KEY } from '../assets/js/splash-state.js';
import { shouldPlay } from '../assets/js/splash.js';

/**
 * Builds a fake window/document pair with a stubbed media query, location,
 * referrer and an in-memory sessionStorage.
 * @param {{ reducedMotion?: boolean, hash?: string, origin?: string, referrer?: string, store?: Map<string, string>, missing?: boolean, throwingGetter?: boolean, throwingSet?: boolean }} [opts] environment options
 * @returns {{ window: object, document: object, backend: Map<string, string> }} fake environment
 */
function makeEnv({
  reducedMotion = false,
  hash = '',
  origin = 'https://konsulin.care',
  referrer = '',
  store,
  missing = false,
  throwingGetter = false,
  throwingSet = false,
} = {}) {
  const backend = store ?? new Map();
  const sessionStorage = {
    getItem: (key) => (backend.has(key) ? backend.get(key) : null),
    setItem: (key, value) => {
      if (throwingSet) throw new Error('quota');
      backend.set(key, value);
    },
  };
  const win = {
    matchMedia: () => ({ matches: reducedMotion }),
    location: { hash, origin },
  };
  if (throwingGetter) {
    Object.defineProperty(win, 'sessionStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  } else if (!missing) {
    win.sessionStorage = sessionStorage;
  }
  const doc = { referrer };
  return { window: win, document: doc, backend };
}

test('shouldPlay returns true on a first visit and stores the key', () => {
  const env = makeEnv();
  assert.equal(shouldPlay(env), true);
  assert.equal(env.backend.get(SPLASH_KEY), '1');
});

test('shouldPlay returns false under reduced motion', () => {
  const env = makeEnv({ reducedMotion: true });
  assert.equal(shouldPlay(env), false);
  assert.equal(env.backend.get(SPLASH_KEY), undefined);
});

test('shouldPlay returns false with a non-empty hash', () => {
  const env = makeEnv({ hash: '#mulai' });
  assert.equal(shouldPlay(env), false);
  assert.equal(env.backend.get(SPLASH_KEY), undefined);
});

test('shouldPlay returns false on a same-origin referrer', () => {
  const env = makeEnv({ origin: 'https://konsulin.care', referrer: 'https://konsulin.care/blog/' });
  assert.equal(shouldPlay(env), false);
});

test('shouldPlay returns true on a cross-origin referrer', () => {
  const env = makeEnv({ origin: 'https://konsulin.care', referrer: 'https://example.org/post' });
  assert.equal(shouldPlay(env), true);
});

test('shouldPlay treats an unparseable referrer as cross-origin', () => {
  const env = makeEnv({ referrer: 'not a url' });
  assert.equal(shouldPlay(env), true);
});

test('shouldPlay returns false when the key is already set', () => {
  const env = makeEnv({ store: new Map([[SPLASH_KEY, '1']]) });
  assert.equal(shouldPlay(env), false);
});

test('shouldPlay returns false when sessionStorage is missing', () => {
  const env = makeEnv({ missing: true });
  assert.equal(env.window.sessionStorage, undefined);
  assert.equal(shouldPlay(env), false);
});

test('shouldPlay returns false when the sessionStorage getter throws', () => {
  const env = makeEnv({ throwingGetter: true });
  assert.equal(shouldPlay(env), false);
});

test('shouldPlay returns false when setItem throws', () => {
  const env = makeEnv({ throwingSet: true });
  assert.equal(shouldPlay(env), false);
});
