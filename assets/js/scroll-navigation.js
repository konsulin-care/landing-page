// Scroll Navigation - Alpine.js component for section-based scrolling
// Sections are counted from the DOM at init time, so the component stays
// correct no matter how many scroll-snap sections the homepage defines.
const SCROLL_CONFIG = {
  SCROLL_THRESHOLD: 100,        // Pixels to scroll before triggering snap
  SCROLL_TIMEOUT: 150,          // Delay to reset scroll tracking after scroll stops
  SCROLL_DURATION: 500,         // Duration of smooth scroll animation
  HEADER_HEIGHT: 64,            // Header offset in pixels
  OBSERVER_MARGIN: '-50% 0px -50% 0px',  // Trigger at viewport center
  TOUCH_THRESHOLD: 70,          // Pixels of vertical swipe before triggering snap
};

// Reusable Alpine component for scroll-based section navigation
function scrollNavigation() {
  return {
    currentSection: 1,
    totalSections: 0,
    clickedBtn: null,
    lastScrollPosition: 0,
    scrollTimeout: null,
    isScrolling: false,
    observer: null,
    isInitialized: false, // Track if we've seen the first section

    init() {
      // Count sections from the DOM instead of hardcoding a value
      this.totalSections = document.querySelectorAll('.scroll-snap-section').length;
      if (this.totalSections === 0) this.totalSections = 1;

      // Initialize scroll position
      this.lastScrollPosition = window.scrollY;

      // Expose this component instance globally for other components to sync
      window.scrollNavigationInstance = this;

      // Set up IntersectionObserver to detect current section
      this.initIntersectionObserver();

      // Set up touch swipe navigation
      this.initTouchTracking();
    },

    initTouchTracking() {
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchActive = false;
      this.touchStartSection = 1;

      // Bind once so listeners can be removed in destroy()
      this.onTouchStart = this.handleTouchStart.bind(this);
      this.onTouchMove = this.handleTouchMove.bind(this);
      this.onTouchEnd = this.handleTouchEnd.bind(this);

      document.addEventListener('touchstart', this.onTouchStart, { passive: true });
      document.addEventListener('touchmove', this.onTouchMove, { passive: false });
      document.addEventListener('touchend', this.onTouchEnd, { passive: true });
    },

    handleTouchStart(e) {
      if (e.touches.length !== 1) return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchActive = true;
      this.touchStartSection = this.currentSection;
    },

    handleTouchMove(e) {
      if (!this.touchActive || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.touchStartX;
      const deltaY = e.touches[0].clientY - this.touchStartY;
      // Lock native scroll for vertical swipes so each slide snaps cleanly
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        e.preventDefault();
      }
    },

    handleTouchEnd(e) {
      if (!this.touchActive) return;
      this.touchActive = false;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaY = touch.clientY - this.touchStartY;
      const deltaX = touch.clientX - this.touchStartX;

      // Only vertical-dominant swipes past the threshold navigate sections
      if (
        Math.abs(deltaY) < SCROLL_CONFIG.TOUCH_THRESHOLD ||
        Math.abs(deltaY) <= Math.abs(deltaX)
      ) {
        return;
      }

      if (deltaY < 0 && this.touchStartSection < this.totalSections) {
        // Swipe up - next section
        this.scrollToSection(this.touchStartSection + 1);
      } else if (deltaY > 0 && this.touchStartSection > 1) {
        // Swipe down - previous section
        this.scrollToSection(this.touchStartSection - 1);
      }
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
              this.isInitialized = true;
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
      // Default section navigation
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
      if (this.onTouchStart) {
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
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
