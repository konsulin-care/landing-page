/** Rotation interval for the hero headline lines, in milliseconds. */
export const ROTATION_MS = 5500;

/** Clock tick for the shared hero progress and rotation state, in milliseconds. */
export const TICK_MS = 100;

/**
 * Builds the Alpine.js data object for the rotating hero headline.
 * The component advances the active line on a set interval, but only while
 * the tab is visible and the visitor is not hovering or focusing the headline.
 * @param {number} n number of hero lines to rotate through
 * @param {{ window?: Window, document?: Document, setInterval?: (fn: () => void, ms: number) => unknown }} [env] injectable environment for tests
 * @returns {{ i: number, n: number, paused: boolean, hiddenClass: string, init: () => void }} Alpine data object
 */
export function heroRotation(n, env = {}) {
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const every = env.setInterval ?? ((fn, ms) => setInterval(fn, ms));
  return {
    i: 1,
    n,
    paused: false,
    hiddenClass: 'invisible opacity-0',
    init() {
      if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      every(() => {
        if (!doc.hidden && !this.paused) this.i = (this.i + 1) % this.n;
      }, ROTATION_MS);
    },
  };
}

/**
 * Builds the Alpine.js data object for the shared hero clock. One clock drives
 * both the rotating headline pair and the trust chip, holding whenever any
 * pause reason is held or the document is hidden.
 * @param {number} n number of hero pairs to rotate through
 * @param {{ window?: Window, document?: Document, setInterval?: (fn: () => void, ms: number) => unknown }} [env] injectable environment for tests
 * @returns {{ i: number, n: number, elapsed: number, cycled: boolean, holds: string[], hiddenClass: string, paused: boolean, hold: (reason: string) => void, release: (reason: string) => void, progress: () => number, init: () => void }} Alpine data object
 */
export function heroSync(n, env = {}) {
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const every = env.setInterval ?? ((fn, ms) => setInterval(fn, ms));
  const reducedMotion = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    i: 1,
    n,
    elapsed: 0,
    cycled: false,
    holds: [],
    hiddenClass: 'invisible opacity-0',
    get paused() {
      return this.holds.length > 0;
    },
    hold(reason) {
      if (!this.holds.includes(reason)) this.holds.push(reason);
    },
    release(reason) {
      this.holds = this.holds.filter((held) => held !== reason);
    },
    progress() {
      if (reducedMotion()) return 1;
      return Math.min(1, Math.max(0, this.elapsed / ROTATION_MS));
    },
    init() {
      if (reducedMotion()) {
        this.cycled = true;
        return;
      }
      every(() => {
        if (doc.hidden || this.paused) return;
        this.elapsed += TICK_MS;
        if (this.elapsed >= ROTATION_MS) {
          this.i = (this.i + 1) % this.n;
          this.elapsed = 0;
        }
      }, TICK_MS);
    },
  };
}

if (typeof window !== 'undefined') {
  window.jtHeroRotation = heroRotation;
  window.jtHeroSync = heroSync;
}
