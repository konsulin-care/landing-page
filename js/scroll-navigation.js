(() => {
  // <stdin>
  var SCROLL_CONFIG = {
    SCROLL_THRESHOLD: 100,
    // Pixels to scroll before triggering snap
    SCROLL_TIMEOUT: 150,
    // Delay to reset scroll tracking after scroll stops
    SCROLL_DURATION: 500,
    // Duration of smooth scroll animation
    HEADER_HEIGHT: 64,
    // Header offset in pixels
    OBSERVER_MARGIN: "-50% 0px -50% 0px",
    // Trigger at viewport center
    // Vision-Mission section frame configuration
    VISION_SECTION: 2,
    // Section number that has the carousel (1-indexed)
    TOTAL_FRAMES: 3,
    // Number of frames in the carousel
    FRAME_0_BOUNDARY: 0,
    // First frame - can go to previous section
    FRAME_LAST_BOUNDARY: 2
    // Last frame - can go to next section
  };
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
      previousSection: null,
      // Will be set on first intersection
      isInVisionSection: false,
      scrollDelta: 0,
      isInitialized: false,
      // Track if we've seen the first section
      init() {
        this.lastScrollPosition = window.scrollY;
        this.previousSection = null;
        this.isInitialized = false;
        window.scrollNavigationInstance = this;
        this.initIntersectionObserver();
      },
      initIntersectionObserver() {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const sectionNum = parseInt(
                  entry.target.id.replace("section-", "")
                );
                this.currentSection = sectionNum;
                this.isInVisionSection = sectionNum === SCROLL_CONFIG.VISION_SECTION;
                if (this.previousSection !== null && this.previousSection !== sectionNum) {
                  if (this.isInVisionSection) {
                    if (this.previousSection < sectionNum) {
                      this.currentFrame = 0;
                      if (window.visionCarousel) {
                        window.visionCarousel.goTo(0);
                      }
                    } else {
                      this.currentFrame = SCROLL_CONFIG.TOTAL_FRAMES - 1;
                      if (window.visionCarousel) {
                        window.visionCarousel.goTo(this.currentFrame);
                      }
                    }
                  }
                }
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
        document.querySelectorAll(".scroll-snap-section").forEach((section) => {
          this.observer.observe(section);
        });
      },
      handleScroll() {
        if (this.isScrolling) return;
        const currentScroll = window.scrollY;
        const scrollDelta = currentScroll - this.lastScrollPosition;
        this.scrollDelta = scrollDelta;
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.isInVisionSection = this.currentSection === SCROLL_CONFIG.VISION_SECTION;
        if (this.isInVisionSection) {
          this.handleFrameScroll(scrollDelta);
          this.lastScrollPosition = currentScroll;
          this.scrollTimeout = setTimeout(() => {
            this.lastScrollPosition = window.scrollY;
          }, SCROLL_CONFIG.SCROLL_TIMEOUT);
          return;
        }
        if (Math.abs(scrollDelta) > SCROLL_CONFIG.SCROLL_THRESHOLD) {
          if (scrollDelta > 0 && this.currentSection < this.totalSections) {
            this.scrollToSection(this.currentSection + 1);
          } else if (scrollDelta < 0 && this.currentSection > 1) {
            this.scrollToSection(this.currentSection - 1);
          }
          this.lastScrollPosition = currentScroll;
          this.scrollTimeout = setTimeout(() => {
            this.lastScrollPosition = window.scrollY;
          }, SCROLL_CONFIG.SCROLL_TIMEOUT);
        }
      },
      // Handle scroll within vision-mission section (section 2)
      handleFrameScroll(scrollDelta) {
        if (Math.abs(scrollDelta) < SCROLL_CONFIG.SCROLL_THRESHOLD) return;
        if (scrollDelta > 0) {
          if (this.currentFrame < SCROLL_CONFIG.TOTAL_FRAMES - 1) {
            this.nextFrame();
          } else {
            if (this.currentSection < this.totalSections) {
              this.scrollToSection(this.currentSection + 1);
              this.currentFrame = 0;
            }
          }
        } else {
          if (this.currentFrame > 0) {
            this.prevFrame();
          } else {
            if (this.currentSection > 1) {
              this.scrollToSection(this.currentSection - 1);
              this.currentFrame = SCROLL_CONFIG.TOTAL_FRAMES - 1;
            }
          }
        }
      },
      // Navigate to next frame in vision carousel
      nextFrame() {
        if (this.currentFrame < SCROLL_CONFIG.TOTAL_FRAMES - 1) {
          this.currentFrame++;
          if (window.visionCarousel) {
            window.visionCarousel.next();
          }
          window.dispatchEvent(new CustomEvent("frame-change", {
            detail: { frame: this.currentFrame, direction: "next" }
          }));
        }
      },
      // Navigate to previous frame in vision carousel
      prevFrame() {
        if (this.currentFrame > 0) {
          this.currentFrame--;
          if (window.visionCarousel) {
            window.visionCarousel.prev();
          }
          window.dispatchEvent(new CustomEvent("frame-change", {
            detail: { frame: this.currentFrame, direction: "prev" }
          }));
        }
      },
      scrollToSection(sectionNum) {
        if (this.isScrolling || sectionNum === this.currentSection) return;
        this.isScrolling = true;
        this.clickedBtn = sectionNum;
        this.previousSection = this.currentSection;
        const section = document.getElementById("section-" + sectionNum);
        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
        setTimeout(() => {
          this.clickedBtn = null;
          this.isScrolling = false;
          this.lastScrollPosition = window.scrollY;
        }, SCROLL_CONFIG.SCROLL_DURATION);
      },
      handleKeydown(e) {
        this.isInVisionSection = this.currentSection === SCROLL_CONFIG.VISION_SECTION;
        if (this.isInVisionSection) {
          this.handleFrameKeydown(e);
          return;
        }
        if (e.key === "ArrowDown" || e.key === "PageDown") {
          e.preventDefault();
          if (this.currentSection < this.totalSections) {
            this.scrollToSection(this.currentSection + 1);
          }
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
          e.preventDefault();
          if (this.currentSection > 1) {
            this.scrollToSection(this.currentSection - 1);
          }
        }
      },
      // Handle keyboard navigation within vision-mission section
      handleFrameKeydown(e) {
        if (e.key === "ArrowDown" || e.key === "PageDown") {
          e.preventDefault();
          if (this.currentFrame < SCROLL_CONFIG.TOTAL_FRAMES - 1) {
            this.nextFrame();
          } else if (this.currentSection < this.totalSections) {
            this.scrollToSection(this.currentSection + 1);
            this.currentFrame = 0;
          }
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
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
  document.addEventListener("alpine:init", () => {
    Alpine.data("scrollNavigation", scrollNavigation);
  });
  if (typeof Alpine !== "undefined") {
    Alpine.data("scrollNavigation", scrollNavigation);
  }
})();
