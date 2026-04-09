// Scroll Navigation - Extracted Alpine.js component for section-based scrolling
// Configuration constants - easy to tune without digging into logic
const SCROLL_CONFIG = {
  SCROLL_THRESHOLD: 100,        // Pixels to scroll before triggering snap
  SCROLL_TIMEOUT: 150,          // Delay to reset scroll tracking after scroll stops
  SCROLL_DURATION: 500,        // Duration of smooth scroll animation
  HEADER_HEIGHT: 64,           // Header offset in pixels
  OBSERVER_MARGIN: '-50% 0px -50% 0px',  // Trigger at viewport center
  
  // Vision-Mission section frame configuration
  VISION_SECTION: 2,           // Section number that has the carousel (1-indexed)
  TOTAL_FRAMES: 3,             // Number of frames in the carousel
  FRAME_0_BOUNDARY: 0,        // First frame - can go to previous section
  FRAME_LAST_BOUNDARY: 2      // Last frame - can go to next section
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
    
    // Frame tracking for section 2 (vision-mission carousel)
    currentFrame: 0,
    previousSection: null, // Will be set on first intersection
    isInVisionSection: false,
    scrollDelta: 0,
    isInitialized: false, // Track if we've seen the first section

    init() {
      // Initialize scroll position
      this.lastScrollPosition = window.scrollY;
      this.previousSection = null; // Will be set when first section is detected
      this.isInitialized = false;
      
      // Expose this component instance globally for vision-carousel to sync
      window.scrollNavigationInstance = this;
      
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
              
              // Check if entering/leaving vision section
              this.isInVisionSection = (sectionNum === SCROLL_CONFIG.VISION_SECTION);
              
              // Only process if this is a section change (not initial load)
              if (this.previousSection !== null && this.previousSection !== sectionNum) {
                // Set initial frame based on direction of entry
                if (this.isInVisionSection) {
                  if (this.previousSection < sectionNum) {
                    // Entering from previous section (scrolling down) - start at frame 0
                    this.currentFrame = 0;
                    // Force carousel to show frame 0
                    if (window.visionCarousel) {
                      window.visionCarousel.goTo(0);
                    }
                  } else {
                    // Entering from next section (scrolling up) - start at last frame
                    this.currentFrame = SCROLL_CONFIG.TOTAL_FRAMES - 1;
                    // Update the vision carousel to show the last frame
                    if (window.visionCarousel) {
                      window.visionCarousel.goTo(this.currentFrame);
                    }
                  }
                }
              }
              
              // Update previous section for next transition
              this.previousSection = sectionNum;
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
      this.scrollDelta = scrollDelta;

      // Clear previous timeout
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Check if we're in the vision-mission section (section 2)
      this.isInVisionSection = (this.currentSection === SCROLL_CONFIG.VISION_SECTION);

      if (this.isInVisionSection) {
        // Handle frame navigation within section 2
        this.handleFrameScroll(scrollDelta);
        
        this.lastScrollPosition = currentScroll;
        this.scrollTimeout = setTimeout(() => {
          this.lastScrollPosition = window.scrollY;
        }, SCROLL_CONFIG.SCROLL_TIMEOUT);
        return;
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

    // Handle scroll within vision-mission section (section 2)
    handleFrameScroll(scrollDelta) {
      // Only trigger on significant scroll
      if (Math.abs(scrollDelta) < SCROLL_CONFIG.SCROLL_THRESHOLD) return;

      if (scrollDelta > 0) {
        // Scrolling down - advance frame
        if (this.currentFrame < SCROLL_CONFIG.TOTAL_FRAMES - 1) {
          // Advance to next frame
          this.nextFrame();
        } else {
          // At last frame - move to next section
          if (this.currentSection < this.totalSections) {
            this.scrollToSection(this.currentSection + 1);
            this.currentFrame = 0;  // Reset frame for next visit
          }
        }
      } else {
        // Scrolling up - go to previous frame
        if (this.currentFrame > 0) {
          // Go to previous frame
          this.prevFrame();
        } else {
          // At first frame - move to previous section
          if (this.currentSection > 1) {
            this.scrollToSection(this.currentSection - 1);
            this.currentFrame = SCROLL_CONFIG.TOTAL_FRAMES - 1;  // Set to last frame for next visit
          }
        }
      }
    },

    // Navigate to next frame in vision carousel
    nextFrame() {
      if (this.currentFrame < SCROLL_CONFIG.TOTAL_FRAMES - 1) {
        this.currentFrame++;
        
        // Call vision carousel's next function if available
        if (window.visionCarousel) {
          window.visionCarousel.next();
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('frame-change', { 
          detail: { frame: this.currentFrame, direction: 'next' }
        }));
      }
    },

    // Navigate to previous frame in vision carousel
    prevFrame() {
      if (this.currentFrame > 0) {
        this.currentFrame--;
        
        // Call vision carousel's prev function if available
        if (window.visionCarousel) {
          window.visionCarousel.prev();
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('frame-change', { 
          detail: { frame: this.currentFrame, direction: 'prev' }
        }));
      }
    },

    scrollToSection(sectionNum) {
      // Don't scroll if already scrolling or if already on target section
      if (this.isScrolling || sectionNum === this.currentSection) return;

      this.isScrolling = true;
      this.clickedBtn = sectionNum;
      
      // Update previous section before navigating
      this.previousSection = this.currentSection;

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
      // Check if we're in the vision-mission section
      this.isInVisionSection = (this.currentSection === SCROLL_CONFIG.VISION_SECTION);

      if (this.isInVisionSection) {
        // Handle frame navigation within section 2
        this.handleFrameKeydown(e);
        return;
      }

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

    // Handle keyboard navigation within vision-mission section
    handleFrameKeydown(e) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (this.currentFrame < SCROLL_CONFIG.TOTAL_FRAMES - 1) {
          this.nextFrame();
        } else if (this.currentSection < this.totalSections) {
          this.scrollToSection(this.currentSection + 1);
          this.currentFrame = 0;
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (this.currentFrame > 0) {
          this.prevFrame();
        } else if (this.currentSection > 1) {
          this.scrollToSection(this.currentSection - 1);
          this.currentFrame = SCROLL_CONFIG.TOTAL_FRAMES - 1;
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
