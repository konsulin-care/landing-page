// Scroll Navigation - Extracted Alpine.js component for section-based scrolling
// Configuration constants - easy to tune without digging into logic
const SCROLL_CONFIG = {
  SCROLL_THRESHOLD: 100,        // Pixels to scroll before triggering snap
  SCROLL_TIMEOUT: 150,          // Delay to reset scroll tracking after scroll stops
  SCROLL_DURATION: 500,        // Duration of smooth scroll animation
  HEADER_HEIGHT: 64,           // Header offset in pixels
  OBSERVER_MARGIN: '-50% 0px -50% 0px'  // Trigger at viewport center
};

// Reusable Alpine component for scroll-based section navigation
function scrollNavigation() {
  return {
    currentSection: 1,
    totalSections: 5,
    clickedBtn: null,
    lastScrollPosition: 0,
    scrollTimeout: null,
    isScrolling: false,
    observer: null,

    init() {
      // Initialize scroll position
      this.lastScrollPosition = window.scrollY;

      // Set up IntersectionObserver to detect current section
      this.initIntersectionObserver();
    },

    initIntersectionObserver() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const sectionNum = parseInt(
                entry.target.id.replace('section-', '')
              );
              this.currentSection = sectionNum;
            }
          });
        },
        {
          root: null,
          rootMargin: SCROLL_CONFIG.OBSERVER_MARGIN,
          threshold: 0
        }
      );

      // Observe all scroll-snap sections
      document.querySelectorAll('.scroll-snap-section').forEach(section => {
        this.observer.observe(section);
      });
    },

    handleScroll() {
      // Don't handle scroll if already smoothly scrolling
      if (this.isScrolling) return;

      const currentScroll = window.scrollY;
      const scrollDelta = currentScroll - this.lastScrollPosition;

      // Clear previous timeout
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Only snap if scrolled more than threshold
      if (Math.abs(scrollDelta) > SCROLL_CONFIG.SCROLL_THRESHOLD) {
        // Determine direction: negative = scrolling up, positive = scrolling down
        if (scrollDelta > 0 && this.currentSection < this.totalSections) {
          // Scrolling down - go to next section
          this.scrollToSection(this.currentSection + 1);
        } else if (scrollDelta < 0 && this.currentSection > 1) {
          // Scrolling up - go to previous section
          this.scrollToSection(this.currentSection - 1);
        }

        this.lastScrollPosition = currentScroll;

        // Set timeout to reset scroll tracking after scrolling stops
        this.scrollTimeout = setTimeout(() => {
          this.lastScrollPosition = window.scrollY;
        }, SCROLL_CONFIG.SCROLL_TIMEOUT);
      }
    },

    scrollToSection(sectionNum) {
      // Don't scroll if already scrolling or if already on target section
      if (this.isScrolling || sectionNum === this.currentSection) return;

      this.isScrolling = true;
      this.clickedBtn = sectionNum;

      const section = document.getElementById('section-' + sectionNum);
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Don't set currentSection here - let IntersectionObserver detect it
      }

      setTimeout(() => {
        this.clickedBtn = null;
        this.isScrolling = false;
        // Update lastScrollPosition after smooth scroll completes
        // This prevents multiple section changes from one scroll event
        this.lastScrollPosition = window.scrollY;
      }, SCROLL_CONFIG.SCROLL_DURATION);
    },

    handleKeydown(e) {
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
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
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
