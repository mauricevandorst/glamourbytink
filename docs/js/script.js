//
// Global JavaScript for the Glamour by Tink site.
// Handles responsive navigation toggling and a simple
// testimonial slider on the home page.

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Testimonials slider (on homepage)
  const reviewsContainer = document.getElementById('reviewsInner');
  const prevBtn = document.getElementById('prevReview');
  const nextBtn = document.getElementById('nextReview');
  if (reviewsContainer && prevBtn && nextBtn) {
    const items = reviewsContainer.children;
    let currentIndex = 0;
    const total = items.length;
    function updateSlider() {
      const offset = currentIndex * 100;
      reviewsContainer.style.transform = `translateX(-${offset}%)`;
    }
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + total) % total;
      updateSlider();
    });
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % total;
      updateSlider();
    });
  }
});