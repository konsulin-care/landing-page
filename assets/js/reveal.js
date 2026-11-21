/** Fraction of the element that must be visible before the reveal fires. */
export const THRESHOLD = 0.3;

/** IntersectionObserver root margin, so the reveal waits a little past the fold. */
export const ROOT_MARGIN = '0px 0px -10% 0px';

/**
 * Builds the Alpine.js data object for a play-once viewport reveal. The
 * element starts shown, so the markup is visible when JavaScript never runs
 * and under reduced motion. Only when motion is allowed and
 * IntersectionObserver exists does `init()` hide it and watch it until it
 * first enters the viewport, then reveal it and stop observing.
 * @param {{ threshold?: number, rootMargin?: string }} [opts] reveal options
 * @param {{ window?: Window, IntersectionObserver?: typeof IntersectionObserver }} [env] injectable environment for tests
 * @returns {{ shown: boolean, init: () => void }} Alpine data object
 */
export function reveal(opts = {}, env = {}) {
  const threshold = opts.threshold ?? THRESHOLD;
  const rootMargin = opts.rootMargin ?? ROOT_MARGIN;
  const win = env.window ?? globalThis.window;
  const Observer = env.IntersectionObserver ?? globalThis.IntersectionObserver;
  const reducedMotion = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    shown: true,

    /** Hides the element and reveals it once, when motion and observer support allow. */
    init() {
      if (typeof Observer !== 'function' || reducedMotion()) return;
      this.shown = false;
      const observer = new Observer(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          this.shown = true;
          observer.disconnect();
        },
        { threshold, rootMargin },
      );
      observer.observe(this.$el);
    },
  };
}

if (typeof window !== 'undefined') {
  window.jtReveal = reveal;
}
