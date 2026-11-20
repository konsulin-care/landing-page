import {
  SPLASH_KEY,
  SPLASH_CLASS,
  SPLASH_RUN_CLASS,
  SPLASH_DONE_EVENT,
  SPLASH_FALLBACK_MS,
  VEIL_ANIMATION,
} from './splash-state.js';

/** Per-documentElement bookkeeping for the running splash. */
const SPLASH_STATE = new WeakMap();

/**
 * Returns whether an element's classList contains a class, tolerating both a
 * DOMTokenList and the Set-based fake used in tests.
 * @param {Element} el element to inspect
 * @param {string} name class name to look for
 * @returns {boolean} true when the class is present
 */
function hasClass(el, name) {
  const list = el.classList;
  if (typeof list.contains === 'function') return list.contains(name);
  if (typeof list.has === 'function') return list.has(name);
  return false;
}

/**
 * Removes a class from an element's classList, tolerating both a DOMTokenList
 * and the Set-based fake used in tests.
 * @param {Element} el element to update
 * @param {string} name class name to remove
 * @returns {void}
 */
function removeClass(el, name) {
  const list = el.classList;
  if (typeof list.remove === 'function') list.remove(name);
  else if (typeof list.delete === 'function') list.delete(name);
}

/**
 * Returns the mutable splash bookkeeping for a document, creating it on demand.
 * @param {Document} doc document whose documentElement anchors the state
 * @returns {{ listener: ((event: Event) => void) | null, timer: unknown, done: boolean }} splash state
 */
function splashState(doc) {
  let state = SPLASH_STATE.get(doc.documentElement);
  if (!state) {
    state = { listener: null, timer: null, done: false };
    SPLASH_STATE.set(doc.documentElement, state);
  }
  return state;
}

/**
 * Decides whether the splash should play in this tab session. Skips under
 * reduced motion, with a non-empty location hash, on a same-origin referrer,
 * when sessionStorage is unavailable or throws, or when the key is already set.
 * On a first visit it marks the key so later views in the session skip it.
 * @param {{ window?: Window, document?: Document }} [env] injectable environment for tests
 * @returns {boolean} true when the splash should play, false when it should be skipped
 */
export function shouldPlay(env = {}) {
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (win.location.hash) return false;
  if (doc.referrer) {
    try {
      if (new URL(doc.referrer).origin === win.location.origin) return false;
    } catch {
      // An unparseable referrer counts as cross-origin, so the splash may play.
    }
  }
  let store;
  try {
    store = win.sessionStorage;
    if (!store) return false;
    if (store.getItem(SPLASH_KEY) !== null) return false;
    store.setItem(SPLASH_KEY, '1');
  } catch {
    return false;
  }
  return true;
}

/**
 * Computes the transform needed to move the lockup from its nav slot to the
 * viewport centre and scale it up. With transform-origin centre and
 * `translate(x, y) scale(s)` the lockup centre lands on the viewport centre.
 * @param {{ left: number, top: number, width: number, height: number }} rect lockup bounding rect
 * @param {{ width: number, height: number }} viewport viewport size
 * @returns {{ x: number, y: number, scale: number }} translation and scale for the lockup
 */
export function dockOffset(rect, viewport) {
  const x = viewport.width / 2 - (rect.left + rect.width / 2);
  const y = viewport.height / 2 - (rect.top + rect.height / 2);
  if (rect.width <= 0) return { x, y, scale: 1 };
  const scale = Math.max(1, Math.min(2, (0.6 * viewport.width) / rect.width));
  return { x, y, scale };
}

/**
 * Starts the splash timeline when the gate allows it. Adds the splash class,
 * wires the veil animationend and fallback cleanup, and exposes the dock hook.
 * @param {{ window?: Window, document?: Document, setTimeout?: (fn: () => void, ms: number) => unknown, clearTimeout?: (id: unknown) => void }} [env] injectable environment for tests
 * @returns {boolean} true when the splash started, false when it was skipped
 */
export function start(env = {}) {
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const setTimer = env.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  if (!shouldPlay(env)) return false;
  const root = doc.documentElement;
  const state = splashState(doc);
  state.done = false;
  root.classList.add(SPLASH_CLASS);
  const listener = (event) => {
    if (event.animationName === VEIL_ANIMATION) cleanup(env);
  };
  state.listener = listener;
  root.addEventListener('animationend', listener);
  state.timer = setTimer(() => cleanup(env), SPLASH_FALLBACK_MS);
  win.jtSplashDock = () => dock(env);
  return true;
}

/**
 * Moves the real nav lockup to the viewport centre by setting the splash CSS
 * variables from its measured rect, then starts the run timeline.
 * @param {{ window?: Window, document?: Document }} [env] injectable environment for tests
 * @returns {void}
 */
export function dock(env = {}) {
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const root = doc.documentElement;
  const logo = doc.querySelector('[data-splash-logo]');
  if (!logo || !hasClass(root, SPLASH_CLASS)) return;
  const rect = logo.getBoundingClientRect();
  const viewport = { width: root.clientWidth, height: win.innerHeight };
  const { x, y, scale } = dockOffset(rect, viewport);
  root.style.setProperty('--jt-splash-x', `${x}px`);
  root.style.setProperty('--jt-splash-y', `${y}px`);
  root.style.setProperty('--jt-splash-scale', String(scale));
  root.classList.add(SPLASH_RUN_CLASS);
}

/**
 * Tears down the splash once: clears the fallback timer, removes the listener,
 * classes and CSS variables, then announces completion on the window.
 * @param {{ window?: Window, document?: Document, clearTimeout?: (id: unknown) => void }} [env] injectable environment for tests
 * @returns {void}
 */
export function cleanup(env = {}) {
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const clearTimer = env.clearTimeout ?? ((id) => clearTimeout(id));
  const root = doc.documentElement;
  const state = splashState(doc);
  if (state.done) return;
  state.done = true;
  if (state.timer !== null) {
    clearTimer(state.timer);
    state.timer = null;
  }
  removeClass(root, SPLASH_CLASS);
  removeClass(root, SPLASH_RUN_CLASS);
  root.style.removeProperty('--jt-splash-x');
  root.style.removeProperty('--jt-splash-y');
  root.style.removeProperty('--jt-splash-scale');
  if (state.listener) {
    root.removeEventListener('animationend', state.listener);
    state.listener = null;
  }
  const CustomEventCtor = win.CustomEvent;
  if (typeof CustomEventCtor === 'function') {
    win.dispatchEvent(new CustomEventCtor(SPLASH_DONE_EVENT));
  } else {
    const EventCtor = win.Event ?? globalThis.Event;
    win.dispatchEvent(new EventCtor(SPLASH_DONE_EVENT));
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') start();
