/** Rotation interval for the hero headline lines, in milliseconds. */
export const ROTATION_MS = 7000;

/** Clock tick for the shared hero progress and rotation state, in milliseconds. */
export const TICK_MS = 100;

/** Minimum horizontal drag distance, in pixels, that counts as a swipe. */
export const SWIPE_PX = 40;

/**
 * Builds the Alpine.js data object for the shared hero clock. One clock drives
 * both the rotating headline pair and the trust chip, holding whenever any
 * pause reason is held or the document is hidden.
 * @param {number} n number of hero pairs to rotate through
 * @param {{ window?: Window, document?: Document, setInterval?: (fn: () => void, ms: number) => unknown }} [env] injectable environment for tests
 * @returns {{ i: number, n: number, elapsed: number, cycled: boolean, gloss: number | null, holds: string[], hiddenClass: string, paused: boolean, hold: (reason: string) => void, release: (reason: string) => void, openGloss: (k: number) => void, closeGloss: () => void, progress: () => number, select: (k: number) => void, next: () => void, prev: () => void, swipeStart: (x: number) => void, swipeEnd: (x: number) => void, init: () => void }} Alpine data object
 */
export function heroSync(n, env = {}) {
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const every = env.setInterval ?? ((fn, ms) => setInterval(fn, ms));
  const reducedMotion = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const active = new Set([0]);
  return {
    i: 0,
    n,
    elapsed: 0,
    cycled: false,
    gloss: null,
    picked: null,
    holds: [],
    startX: undefined,
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
    /** Opens the gloss at index k and holds the clock while it stays open. */
    openGloss(k) {
      this.gloss = k;
      this.hold('gloss');
    },
    /** Closes the open gloss and releases the clock hold. */
    closeGloss() {
      this.gloss = null;
      this.release('gloss');
    },
    progress() {
      if (reducedMotion()) return 1;
      return Math.min(1, Math.max(0, this.elapsed / ROTATION_MS));
    },
    /** Records the active index and marks the cycle complete once all are seen. */
    track(k) {
      active.add(k);
      if (active.size >= this.n) this.cycled = true;
    },
    /** Records the sample answer k and holds the clock on the demo. */
    answer(k) {
      this.picked = k;
      this.hold('demo');
    },
    select(k) {
      this.picked = null;
      this.release('demo');
      this.i = k;
      this.elapsed = 0;
      this.track(k);
    },
    next() {
      this.select((this.i + 1) % this.n);
    },
    prev() {
      this.select((this.i - 1 + this.n) % this.n);
    },
    swipeStart(x) {
      this.startX = x;
    },
    swipeEnd(x) {
      if (this.startX === undefined) return;
      const dx = x - this.startX;
      this.startX = undefined;
      if (dx <= -SWIPE_PX) this.next();
      else if (dx >= SWIPE_PX) this.prev();
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
          this.picked = null;
          this.release('demo');
          this.elapsed = 0;
          this.track(this.i);
        }
      }, TICK_MS);
    },
  };
}

if (typeof window !== 'undefined') {
  window.jtHeroSync = heroSync;
}
