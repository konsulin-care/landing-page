(() => {
  // <stdin>
  document.addEventListener("DOMContentLoaded", function() {
    const carousel = document.getElementById("vision-carousel");
    if (!carousel) return;
    let currentFrame = 0;
    const maxFrames = 3;
    let timer = null;
    function updateFrame() {
      const featureFrames = carousel.querySelectorAll(".feature-frame");
      featureFrames.forEach(function(frame, index) {
        if (index === currentFrame) {
          frame.style.display = "block";
          frame.classList.add("animate-in");
        } else {
          frame.style.display = "none";
          frame.classList.remove("animate-in");
        }
      });
      const textFrames = carousel.querySelectorAll(".text-frame");
      textFrames.forEach(function(frame, index) {
        if (index === currentFrame) {
          frame.style.display = "block";
          setTimeout(function() {
            frame.classList.add("active");
          }, 10);
        } else {
          frame.classList.remove("active");
          setTimeout(function() {
            if (!frame.classList.contains("active")) {
              frame.style.display = "none";
            }
          }, 500);
        }
      });
      const indicators = carousel.querySelectorAll(".progress-dot");
      indicators.forEach(function(dot, index) {
        if (index === currentFrame) {
          dot.classList.add("bg-primary-600");
          dot.classList.remove("bg-gray-300", "dark:bg-gray-700");
        } else {
          dot.classList.remove("bg-primary-600");
          dot.classList.add("bg-gray-300", "dark:bg-gray-700");
        }
      });
      syncWithAlpine(currentFrame);
    }
    function syncWithAlpine(frame) {
      if (window.Alpine) {
        const mainElement = document.querySelector('[x-data*="scrollNavigation"]');
        if (mainElement && Alpine.$data(mainElement)) {
          const navComponent = Alpine.$data(mainElement);
          if (navComponent && typeof navComponent.currentFrame !== "undefined") {
            navComponent.currentFrame = frame;
          }
        }
      }
      if (window.scrollNavigationInstance) {
        window.scrollNavigationInstance.currentFrame = frame;
      }
      window.dispatchEvent(new CustomEvent("carousel-frame-changed", {
        detail: { frame, fromCarousel: true }
      }));
    }
    function updateChevrons() {
      updateChevronPositions();
      const prevBtn = carousel.querySelector(".chevron-left");
      const nextBtn = carousel.querySelector(".chevron-right");
      function updateChevronPositions() {
        const container = carousel.querySelector(".overflow-visible");
        const featureFrames = carousel.querySelectorAll(".feature-frame");
        let visibleFrame = null;
        featureFrames.forEach(function(frame) {
          if (frame.style.display === "block") {
            visibleFrame = frame;
          }
        });
        if (visibleFrame && container) {
          const image = visibleFrame.querySelector("img");
          if (image) {
            requestAnimationFrame(function() {
              const imageRect = image.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              if (imageRect.width === 0 || imageRect.height === 0) {
                setTimeout(updateChevronPositions, 100);
                return;
              }
              const imageTopRelative = imageRect.top - containerRect.top;
              const centerPosition = imageTopRelative + imageRect.height / 2;
              const prevBtn2 = carousel.querySelector(".chevron-left");
              const nextBtn2 = carousel.querySelector(".chevron-right");
              if (prevBtn2) {
                prevBtn2.style.top = centerPosition + "px";
              }
              if (nextBtn2) {
                nextBtn2.style.top = centerPosition + "px";
              }
            });
          }
        }
      }
      if (prevBtn) {
        if (currentFrame === 0) {
          prevBtn.disabled = true;
          prevBtn.style.display = "none";
        } else {
          prevBtn.disabled = false;
          prevBtn.style.display = "block";
          prevBtn.classList.remove("opacity-40", "cursor-not-allowed");
          prevBtn.classList.add("hover:bg-white", "dark:hover:bg-gray-700");
        }
      }
      if (nextBtn) {
        if (currentFrame === maxFrames - 1) {
          nextBtn.disabled = true;
          nextBtn.style.display = "none";
        } else {
          nextBtn.disabled = false;
          nextBtn.style.display = "block";
          nextBtn.classList.remove("opacity-40", "cursor-not-allowed");
          nextBtn.classList.add("hover:bg-white", "dark:hover:bg-gray-700");
        }
      }
    }
    function nextFrame() {
      if (currentFrame < maxFrames - 1) {
        currentFrame++;
        updateFrame();
        updateChevrons();
      } else {
        stopTimer();
      }
    }
    function prevFrame() {
      if (currentFrame > 0) {
        currentFrame--;
        updateFrame();
        updateChevrons();
        stopTimer();
        startTimer();
      }
    }
    function goToFrame(frame) {
      currentFrame = frame;
      updateFrame();
      updateChevrons();
      stopTimer();
      startTimer();
    }
    function startTimer() {
      if (timer) return;
      timer = setInterval(nextFrame, 5e3);
    }
    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function initScrollDetection() {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      }, { threshold: 0.3 });
      observer.observe(carousel);
    }
    function initEventListeners() {
      var prevBtn = carousel.querySelector(".chevron-left");
      if (prevBtn) {
        prevBtn.addEventListener("click", function() {
          prevFrame();
          syncWithAlpine(currentFrame);
        });
      }
      var nextBtn = carousel.querySelector(".chevron-right");
      if (nextBtn) {
        nextBtn.addEventListener("click", function() {
          nextFrame();
          syncWithAlpine(currentFrame);
        });
      }
      var dots = carousel.querySelectorAll(".progress-dot");
      dots.forEach(function(dot, index) {
        dot.addEventListener("click", function() {
          goToFrame(index);
          syncWithAlpine(currentFrame);
        });
      });
      window.addEventListener("frame-change", function(e) {
        const carouselEvent = new CustomEvent("carousel-frame-changed", {
          detail: { frame: currentFrame, fromCarousel: true }
        });
        if (e.detail && typeof e.detail.frame !== "undefined") {
          if (e.detail.frame !== currentFrame && !e.detail.fromCarousel) {
            goToFrame(e.detail.frame);
          }
        }
      });
    }
    initScrollDetection();
    initEventListeners();
    updateFrame();
    updateChevrons();
    window.addEventListener("resize", function() {
      updateChevrons();
    });
    window.visionCarousel = {
      next: nextFrame,
      prev: prevFrame,
      goTo: goToFrame,
      getCurrentFrame: function() {
        return currentFrame;
      },
      start: startTimer,
      stop: stopTimer
    };
  });
})();
