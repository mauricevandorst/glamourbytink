//
// Global JavaScript for the Glamour by Tink site.
// Handles responsive navigation toggling and a simple
// testimonial slider on the home page.

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const header = document.querySelector('.site-header');
  if (navToggle && mobileMenu) {
    const mobileLinks = Array.from(mobileMenu.querySelectorAll('a'));

    const setMenuState = (expanded) => {
      navToggle.setAttribute('aria-expanded', String(expanded));
      navToggle.setAttribute('aria-label', expanded ? 'Sluit menu' : 'Open menu');
      mobileMenu.classList.toggle('is-open', expanded);
      mobileMenu.setAttribute('aria-hidden', String(!expanded));

      if (header) {
        header.classList.toggle('is-menu-open', expanded);
      }
    };

    const toggleMenu = () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      setMenuState(!expanded);
    };

    setMenuState(false);
    navToggle.addEventListener('click', toggleMenu);

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setMenuState(false);
      });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setMenuState(false);
      }
    });

    const mobileBreakpoint = window.matchMedia('(min-width: 640px)');
    mobileBreakpoint.addEventListener('change', (event) => {
      if (event.matches) {
        setMenuState(false);
      }
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