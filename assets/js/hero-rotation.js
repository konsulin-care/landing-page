import { nanoId } from './nanoid.js';

/** Rotation interval for the hero headline lines, in milliseconds. */
export const ROTATION_MS = 3000;

/** Clock tick for the shared hero progress and rotation state, in milliseconds. */
export const TICK_MS = 100;

/** Minimum horizontal drag distance, in pixels, that counts as a swipe. */
export const SWIPE_PX = 40;

/**
 * Builds the Alpine.js data object for the shared hero clock. One clock drives
 * both the rotating headline pair and the trust chip, holding whenever any
 * pause reason is held or the document is hidden.
 * @param {number} n number of hero pairs to rotate through
 * @param {{ ms?: number, durations?: number[], idStage?: number, idCount?: number, idPrefix?: string, idSize?: number }} [opts] clock options; `ms` is the fallback rotation interval, `durations` holds one interval per pair index and the id options configure the ID preview
 * @param {{ window?: Window, document?: Document, setInterval?: (fn: () => void, ms: number) => unknown, random?: (n: number) => Uint8Array }} [env] injectable environment for tests
 * @returns {{ i: number, n: number, ids: string[], elapsed: number, cycled: boolean, gloss: number | null, holds: string[], hiddenClass: string, paused: boolean, hold: (reason: string) => void, release: (reason: string) => void, openGloss: (k: number) => void, closeGloss: () => void, duration: () => number, progress: () => number, at: (markMs: number) => boolean, refreshIds: () => void, select: (k: number) => void, next: () => void, prev: () => void, swipeStart: (x: number) => void, swipeEnd: (x: number) => void, init: () => void }} Alpine data object
 */
export function heroSync(n, opts = {}, env = {}) {
  const ms = opts.ms ?? ROTATION_MS;
  const durations = opts.durations ?? [];
  const idStage = opts.idStage ?? 1;
  const idCount = opts.idCount ?? 5;
  const idPrefix = opts.idPrefix ?? 'JT-';
  const idSize = opts.idSize ?? 10;
  const random = env.random;
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const every = env.setInterval ?? ((fn, ms) => setInterval(fn, ms));
  const reducedMotion = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const active = new Set([0]);
  return {
    i: 0,
    n,
    ids: [],
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
    /** Returns how long the pair at the current index stays up, in milliseconds. */
    duration() {
      const stage = durations[this.i];
      return typeof stage === 'number' && stage > 0 ? stage : ms;
    },
    progress() {
      if (reducedMotion()) return 1;
      return Math.min(1, Math.max(0, this.elapsed / this.duration()));
    },
    /**
     * Reports whether the current stage has reached an absolute millisecond mark.
     * Stages can grow longer without slowing the micro-animations inside them.
     * @param {number} markMs mark in milliseconds from the start of the stage
     * @returns {boolean} true once `elapsed` reaches the mark, or always under reduced motion
     */
    at(markMs) {
      if (reducedMotion()) return true;
      return this.elapsed >= markMs;
    },
    /** Regenerates the ID preview cards for the current entry into the ID stage. */
    refreshIds() {
      this.ids = Array.from({ length: idCount }, () => idPrefix + nanoId(idSize, random));
    },
    /** Records the active index and marks the cycle complete once all are seen. */
    track(k) {
      active.add(k);
      if (active.size >= this.n) this.cycled = true;
    },
    /** Records the sample answer k without pausing the clock. */
    answer(k) {
      this.picked = k;
    },
    /** Selects pair k, closing any open gloss and resetting the clock. */
    select(k) {
      if (this.gloss !== null) this.closeGloss();
      const previous = this.i;
      this.picked = null;
      this.i = k;
      this.elapsed = 0;
      this.track(k);
      if (this.i !== previous && this.i === idStage) this.refreshIds();
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
      this.refreshIds();
      if (reducedMotion()) {
        this.cycled = true;
        return;
      }
      every(() => {
        if (doc.hidden || this.paused) return;
        this.elapsed += TICK_MS;
        if (this.elapsed >= this.duration()) {
          const previous = this.i;
          this.i = (this.i + 1) % this.n;
          this.picked = null;
          this.elapsed = 0;
          this.track(this.i);
          if (this.i !== previous && this.i === idStage) this.refreshIds();
        }
      }, TICK_MS);
    },
  };
}

if (typeof window !== 'undefined') {
  window.jtHeroSync = heroSync;
}
