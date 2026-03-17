document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('card-container');
  
  // Exit early if container doesn't exist on this page
  if (!container) return;
  
  const btnLeft = document.getElementById('scroll-left');
  const btnRight = document.getElementById('scroll-right');
  const cards = Array.from(container.children);

  let currentIndex = 0;
  let cardsPerPage = calculateCardsPerPage();

  function calculateCardsPerPage() {
    const containerWidth = container.offsetWidth;
    return containerWidth >= 640 ? 3 : 1; // Adjust breakpoint as needed
  }

  function updateCards() {
    const totalCards = cards.length;
    cards.forEach((card, index) => {
      const position = (index - currentIndex + totalCards) % totalCards;
      card.style.display = position < cardsPerPage ? 'block' : 'none';
    });
    toggleButtons();
  }

  function navigateCarousel(direction) {
    const totalCards = cards.length;
    if (direction === 'left') {
      currentIndex = (currentIndex - 1 + totalCards) % totalCards;
    } else {
      currentIndex = (currentIndex + 1) % totalCards;
    }
    updateCards();
  }

  function toggleButtons() {
    const totalCards = cards.length;
    if (totalCards <= cardsPerPage) {
      btnLeft.style.display = 'none';
      btnRight.style.display = 'none';
    } else {
      btnLeft.style.display = 'block';
      btnRight.style.display = 'block';
    }
  }

  btnLeft.addEventListener('click', () => navigateCarousel('left'));
  btnRight.addEventListener('click', () => navigateCarousel('right'));

  window.addEventListener('resize', () => {
    const newCardsPerPage = calculateCardsPerPage();
    if (newCardsPerPage !== cardsPerPage) {
      cardsPerPage = newCardsPerPage;
      updateCards();
    }
  });

  container.addEventListener('touchstart', function(e) {
    const startX = e.touches[0].pageX;
    container.addEventListener('touchmove', function onMove(e) {
      const moveX = e.touches[0].pageX;
      if (startX - moveX > 50) {
        navigateCarousel('right');
        container.removeEventListener('touchmove', onMove);
      } else if (moveX - startX > 50) {
        navigateCarousel('left');
        container.removeEventListener('touchmove', onMove);
      }
    });
  });

  // Initial setup
  updateCards();
});
