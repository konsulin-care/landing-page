/** Idle delay, in milliseconds, after which the indicator hides again. */
export const HIDE_MS = 800;

/** Smallest thumb height, in pixels, so short pages still show a visible pill. */
export const MIN_THUMB_PX = 32;

/**
 * Builds the Alpine.js data object for the page scroll indicator. The native
 * scrollbar is hidden in CSS, so this overlay thumb is the only scroll
 * affordance: it listens to the window scroll event, which covers wheel,
 * keyboard, trackpad and in-page anchor jumps alike, and fades out once
 * scrolling has been idle for {@link HIDE_MS}.
 * @param {{ hideMs?: number, minThumb?: number }} [opts] indicator options
 * @param {{ window?: Window, document?: Document, setTimeout?: (fn: () => void, ms: number) => unknown, clearTimeout?: (id: unknown) => void, ResizeObserver?: typeof ResizeObserver }} [env] injectable environment for tests
 * @returns {{ visible: boolean, thumb: number, offset: number, measure: () => void, onScroll: () => void, init: () => void }} Alpine data object
 */
export function scrollIndicator(opts = {}, env = {}) {
  const hideMs = opts.hideMs ?? HIDE_MS;
  const minThumb = opts.minThumb ?? MIN_THUMB_PX;
  const win = env.window ?? globalThis.window;
  const doc = env.document ?? globalThis.document;
  const setTimer = env.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = env.clearTimeout ?? ((id) => clearTimeout(id));
  const Observer = env.ResizeObserver ?? globalThis.ResizeObserver;
  let pending = null;

  return {
    visible: false,
    thumb: 0,
    offset: 0,

    /** Recomputes the thumb height and offset from the current viewport metrics. */
    measure() {
      const track = win.innerHeight;
      const scrollHeight = doc.documentElement.scrollHeight;
      const range = scrollHeight - track;
      if (range <= 0) {
        this.thumb = 0;
        this.offset = 0;
        return;
      }
      this.thumb = Math.max(minThumb, Math.round((track * track) / scrollHeight));
      this.offset = Math.round((win.scrollY / range) * (track - this.thumb));
    },

    /** Shows the indicator and restarts the idle timer that hides it again. */
    onScroll() {
      this.measure();
      this.visible = this.thumb > 0;
      if (pending !== null) clearTimer(pending);
      pending = setTimer(() => {
        this.visible = false;
      }, hideMs);
    },

    /** Wires the scroll, resize and content-size listeners and takes a first measurement. */
    init() {
      win.addEventListener('scroll', () => this.onScroll(), { passive: true });
      win.addEventListener('resize', () => this.measure(), { passive: true });
      if (typeof Observer === 'function' && doc.body) {
        new Observer(() => this.measure()).observe(doc.body);
      }
      this.measure();
    },
  };
}

if (typeof window !== 'undefined') {
  window.jtScrollIndicator = scrollIndicator;
}
