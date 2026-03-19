// Vision & Mission Carousel - Plain JavaScript initialization
document.addEventListener('DOMContentLoaded', function() {
  const carousel = document.getElementById('vision-carousel');
  if (!carousel) return;
  
  let currentFrame = 0;
  const maxFrames = 3;
  let timer = null;
  
  // Update UI based on current frame
  function updateFrame() {
    // Update left side (features)
    const featureFrames = carousel.querySelectorAll('.feature-frame');
    featureFrames.forEach(function(frame, index) {
      if (index === currentFrame) {
        frame.style.display = 'block';
        frame.classList.add('animate-in');
      } else {
        frame.style.display = 'none';
        frame.classList.remove('animate-in');
      }
    });
    
    // Update right side (text) - use active class for smooth transitions
    const textFrames = carousel.querySelectorAll('.text-frame');
    textFrames.forEach(function(frame, index) {
      if (index === currentFrame) {
        frame.style.display = 'block';
        // Small delay to allow display:block to apply before adding active class
        setTimeout(function() {
          frame.classList.add('active');
        }, 10);
      } else {
        frame.classList.remove('active');
        // Hide after transition completes
        setTimeout(function() {
          if (!frame.classList.contains('active')) {
            frame.style.display = 'none';
          }
        }, 500);
      }
    });
    
    // Update progress indicators
    const indicators = carousel.querySelectorAll('.progress-dot');
    indicators.forEach(function(dot, index) {
      if (index === currentFrame) {
        dot.classList.add('bg-primary-600');
        dot.classList.remove('bg-gray-300', 'dark:bg-gray-700');
      } else {
        dot.classList.remove('bg-primary-600');
        dot.classList.add('bg-gray-300', 'dark:bg-gray-700');
      }
    });
  }
  
  // Update chevron states
  function updateChevrons() {
    // Calculate and set vertical position based on image
    updateChevronPositions();
    
    const prevBtn = carousel.querySelector('.chevron-left');
    const nextBtn = carousel.querySelector('.chevron-right');
    
    // Dynamically calculate vertical center based on IMAGE position within container
    function updateChevronPositions() {
      const container = carousel.querySelector('.overflow-visible');
      
      // Find the currently visible feature frame
      const featureFrames = carousel.querySelectorAll('.feature-frame');
      let visibleFrame = null;
      featureFrames.forEach(function(frame) {
        if (frame.style.display === 'block') {
          visibleFrame = frame;
        }
      });
      
      if (visibleFrame && container) {
        const image = visibleFrame.querySelector('img');
        if (image) {
          // Use requestAnimationFrame to ensure DOM is fully rendered
          requestAnimationFrame(function() {
            const imageRect = image.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Skip if image hasn't loaded yet (zero dimensions)
            if (imageRect.width === 0 || imageRect.height === 0) {
              // Retry after a short delay
              setTimeout(updateChevronPositions, 100);
              return;
            }
            
            // Calculate the image's position relative to the container
            const imageTopRelative = imageRect.top - containerRect.top;
            const centerPosition = imageTopRelative + (imageRect.height / 2);
            
            const prevBtn = carousel.querySelector('.chevron-left');
            const nextBtn = carousel.querySelector('.chevron-right');
            
            if (prevBtn) {
              prevBtn.style.top = centerPosition + 'px';
            }
            if (nextBtn) {
              nextBtn.style.top = centerPosition + 'px';
            }
          });
        }
      }
    }
    
    if (prevBtn) {
      if (currentFrame === 0) {
        prevBtn.disabled = true;
        prevBtn.style.display = 'none';
      } else {
        prevBtn.disabled = false;
        prevBtn.style.display = 'block';
        prevBtn.classList.remove('opacity-40', 'cursor-not-allowed');
        prevBtn.classList.add('hover:bg-white', 'dark:hover:bg-gray-700');
      }
    }
    
    if (nextBtn) {
      if (currentFrame === maxFrames - 1) {
        nextBtn.disabled = true;
        nextBtn.style.display = 'none';
      } else {
        nextBtn.disabled = false;
        nextBtn.style.display = 'block';
        nextBtn.classList.remove('opacity-40', 'cursor-not-allowed');
        nextBtn.classList.add('hover:bg-white', 'dark:hover:bg-gray-700');
      }
    }
  }
  
  // Navigate to next frame
  function nextFrame() {
    if (currentFrame < maxFrames - 1) {
      currentFrame++;
      updateFrame();
      updateChevrons();
    } else {
      stopTimer();
    }
  }
  
  // Navigate to previous frame
  function prevFrame() {
    if (currentFrame > 0) {
      currentFrame--;
      updateFrame();
      updateChevrons();
      stopTimer();
      startTimer();
    }
  }
  
  // Go to specific frame
  function goToFrame(frame) {
    currentFrame = frame;
    updateFrame();
    updateChevrons();
    stopTimer();
    startTimer();
  }
  
  // Start auto-advance timer
  function startTimer() {
    if (timer) return;
    timer = setInterval(nextFrame, 5000);
  }
  
  // Stop auto-advance timer
  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  
  // Intersection Observer for scroll detection
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
  
  // Initialize event listeners
  function initEventListeners() {
    // Previous button
    var prevBtn = carousel.querySelector('.chevron-left');
    if (prevBtn) {
      prevBtn.addEventListener('click', prevFrame);
    }
    
    // Next button
    var nextBtn = carousel.querySelector('.chevron-right');
    if (nextBtn) {
      nextBtn.addEventListener('click', nextFrame);
    }
    
    // Progress dots
    var dots = carousel.querySelectorAll('.progress-dot');
    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        goToFrame(index);
      });
    });
  }
  
  // Initialize
  initScrollDetection();
  initEventListeners();
  updateFrame();
  updateChevrons();
  
  // Recalculate chevron position on window resize
  window.addEventListener('resize', function() {
    updateChevrons();
  });
  
  // Expose functions globally for potential external use
  window.visionCarousel = {
    next: nextFrame,
    prev: prevFrame,
    goTo: goToFrame,
    start: startTimer,
    stop: stopTimer
  };
});
