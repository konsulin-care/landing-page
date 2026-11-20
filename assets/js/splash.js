import { SPLASH_KEY } from './splash-state.js';

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
