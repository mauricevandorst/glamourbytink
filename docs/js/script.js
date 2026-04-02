//
// Global JavaScript for the Glamour by Tink site.
// Handles responsive navigation toggling and a simple
// testimonial slider on the home page.

document.addEventListener('DOMContentLoaded', () => {
  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = currentYear;
  });

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

  initFooterReveal();
});

// ─────────────────────────────────────────────────────────────
// Footer scroll-reveal
// Uses IntersectionObserver to trigger CSS-driven animations:
//   · Pre-footer CTA  → cascaded entry via .is-revealed
//   · Footer columns  → staggered entry via .is-visible
//   · Divider lines   → draw animation via .is-drawn
// ─────────────────────────────────────────────────────────────
function initFooterReveal() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pre-footer CTA: observe the section, child elements cascade via CSS
  const prefooterCta = document.querySelector('.prefooter-cta');
  if (prefooterCta) {
    if (reducedMotion) {
      prefooterCta.classList.add('is-revealed');
    } else {
      const ctaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              prefooterCta.classList.add('is-revealed');
              ctaObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
      );
      ctaObserver.observe(prefooterCta);
    }
  }

  // Footer columns: each observed individually, CSS handles stagger via nth-child delay
  const footerCols = document.querySelectorAll('.footer-col');
  if (footerCols.length) {
    if (reducedMotion) {
      footerCols.forEach((col) => col.classList.add('is-visible'));
    } else {
      const colObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              colObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
      );
      footerCols.forEach((col) => colObserver.observe(col));
    }
  }

  // Divider lines: animated scaleX draw
  const lines = document.querySelectorAll('.footer-rule');
  if (lines.length) {
    if (reducedMotion) {
      lines.forEach((line) => line.classList.add('is-drawn'));
    } else {
      const lineObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-drawn');
              lineObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      lines.forEach((line) => lineObserver.observe(line));
    }
  }
}