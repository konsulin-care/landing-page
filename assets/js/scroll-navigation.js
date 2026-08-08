// Scroll Navigation - Alpine.js component for section-based navigation
// The hero is an exact-fit slide; sections 2-9 scroll naturally. This
// component tracks the active section via IntersectionObserver (used to
// show/hide the hero down-chevron and the section-2 up-chevron) and powers
// the chevron/keyboard navigation between sections.
const SCROLL_CONFIG = {
  SCROLL_DURATION: 500,         // Duration of smooth scroll animation
  OBSERVER_MARGIN: '-50% 0px -50% 0px',  // Trigger at viewport center
};

// Reusable Alpine component for section-based navigation
function scrollNavigation() {
  return {
    currentSection: 1,
    totalSections: 0,
    isScrolling: false,
    observer: null,

    // All homepage sections. Numbers come from element order, never from
    // the id, so ids stay semantic (e.g. "privacy") and shareable as anchors.
    getSections() {
      return Array.from(document.querySelectorAll('.scroll-snap-section'));
    },

    init() {
      // Count sections from the DOM instead of hardcoding a value
      this.totalSections = document.querySelectorAll('.scroll-snap-section').length;
      if (this.totalSections === 0) this.totalSections = 1;

      // Expose this component instance globally for other components to sync
      window.scrollNavigationInstance = this;

      // Set up IntersectionObserver to detect current section
      this.initIntersectionObserver();

      // Deep link (e.g. #privacy): jump straight to that section on load with
      // instant scroll so there is no observer lag or flash of section 1.
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        const sections = this.getSections();
        const targetIndex = sections.findIndex((s) => s.id === hash);
        if (targetIndex !== -1) {
          this.currentSection = targetIndex + 1;
          sections[targetIndex].scrollIntoView({
            behavior: 'auto',
            block: 'start'
          });
        }
      }
    },

    initIntersectionObserver() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const sectionNum = this.getSections().indexOf(entry.target) + 1;
              this.currentSection = sectionNum;
              this.updateHash(entry.target.id);
            }
          });
        },
        {
          root: null,
          rootMargin: SCROLL_CONFIG.OBSERVER_MARGIN,
          threshold: 0
        }
      );

      // Observe all sections
      this.getSections().forEach(section => {
        this.observer.observe(section);
      });
    },

    // Keep the address bar hash in sync with the active section so the URL
    // stays shareable. replaceState avoids a native hash scroll jump and
    // does not spam the browser history while reading the page.
    updateHash(id) {
      history.replaceState(null, '', '#' + id);
    },

    scrollToSection(sectionNum) {
      // Don't scroll if already scrolling or if already on target section
      if (this.isScrolling || sectionNum === this.currentSection) return;

      this.isScrolling = true;

      const section = this.getSections()[sectionNum - 1];
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Don't set currentSection here - let IntersectionObserver detect it
      }

      setTimeout(() => {
        this.isScrolling = false;
      }, SCROLL_CONFIG.SCROLL_DURATION);
    },

    handleKeydown(e) {
      // Section navigation via keyboard
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (this.currentSection < this.totalSections) {
          this.scrollToSection(this.currentSection + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (this.currentSection > 1) {
          this.scrollToSection(this.currentSection - 1);
        }
      }
    },

    // Cleanup method for proper component teardown
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      if (window.scrollNavigationInstance === this) {
        delete window.scrollNavigationInstance;
      }
    }
  };
}

// Register globally for Alpine.js
// Use both alpine:init and a fallback for robustness
document.addEventListener('alpine:init', () => {
  Alpine.data('scrollNavigation', scrollNavigation);
});

// Fallback: If Alpine is already initialized, register immediately
if (typeof Alpine !== 'undefined') {
  Alpine.data('scrollNavigation', scrollNavigation);
}
