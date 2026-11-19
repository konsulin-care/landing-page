/** Rotation interval for the hero headline lines, in milliseconds. */
export const ROTATION_MS = 5500;

/**
 * Builds the Alpine.js data object for the rotating hero headline.
 * The component advances the active line on a fixed interval, but only while
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

if (typeof window !== 'undefined') window.jtHeroRotation = heroRotation;
