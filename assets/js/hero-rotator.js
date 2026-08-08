// Hero Rotator - Alpine.js component for the rotating hero phrases.
// Cycles the active phrase every 3s (1 -> 2 -> 3 -> 1). Hovering a phrase
// pins it at full opacity; leaving the mouse restarts a fresh 3s countdown
// before the next rotation tick. Phrase count comes from the DOM so the
// component stays correct if the config list grows.
function heroRotator() {
  return {
    activeIndex: 0,
    hovered: null,
    timer: null,

    init() {
      this.schedule();
    },

    // True when this index should render at full opacity.
    activeFor(i) {
      return this.hovered === i || (this.hovered === null && this.activeIndex === i);
    },

    // Pin the hovered phrase and pause the rotation while hovering.
    hold(i) {
      this.hovered = i;
      this.activeIndex = i;
      clearTimeout(this.timer);
    },

    // Unpin; wait 3 seconds before the next rotation tick.
    release() {
      this.hovered = null;
      this.schedule();
    },

    // Advance and reschedule. Skipped while a phrase is hovered.
    schedule() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (this.hovered === null) {
          const total = document.querySelectorAll('[data-hero-rotator-item]').length;
          this.activeIndex = (this.activeIndex + 1) % total;
        }
        this.schedule();
      }, 3000);
    },

    // Cleanup method for proper component teardown.
    destroy() {
      clearTimeout(this.timer);
    },
  };
}

// Register globally for Alpine.js
// Use both alpine:init and a fallback for robustness
document.addEventListener('alpine:init', () => {
  Alpine.data('heroRotator', heroRotator);
});

// Fallback: If Alpine is already initialized, register immediately
if (typeof Alpine !== 'undefined') {
  Alpine.data('heroRotator', heroRotator);
}
