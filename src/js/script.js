//
// Global JavaScript for the Glamour by Tink site.
// Handles responsive navigation toggling and a simple
// testimonial slider on the home page.

document.addEventListener('DOMContentLoaded', () => {
  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = currentYear;
  });

  initAnchorNavigation();
  initBookingWidget();
  initHeaderScrollState();

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

    document.addEventListener('click', (event) => {
      const isMenuOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (!isMenuOpen) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (navToggle.contains(target) || mobileMenu.contains(target)) {
        return;
      }

      setMenuState(false);
    });

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
// Shared header glass effect on scroll
// Keeps the navbar behavior consistent across pages.
// ─────────────────────────────────────────────────────────────
function initHeaderScrollState() {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }

  const updateHeaderState = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  window.addEventListener('load', updateHeaderState);
}

// ─────────────────────────────────────────────────────────────
// Footer scroll-reveal
// Uses IntersectionObserver to trigger CSS-driven animations:
//   · Pre-footer CTA  → cascaded entry via .is-revealed
//   · Footer columns  → staggered entry via .is-visible
//   · Divider lines   → draw animation via .is-drawn
// ─────────────────────────────────────────────────────────────
function initAnchorNavigation() {
  const header = document.querySelector('.site-header');
  const snapContainer = document.querySelector('.panel-scroll');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let snapResetTimer = 0;

  const updateAnchorOffset = () => {
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--site-header-offset', `${headerHeight + 16}px`);
  };

  const temporarilyDisableSnap = () => {
    if (!snapContainer) {
      return;
    }

    snapContainer.classList.add('is-anchor-scrolling');
    window.clearTimeout(snapResetTimer);
    snapResetTimer = window.setTimeout(() => {
      snapContainer.classList.remove('is-anchor-scrolling');
    }, reducedMotion ? 80 : 700);
  };

  const scrollToHash = (hash, behavior = 'smooth') => {
    if (!hash || hash === '#') {
      return false;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    if (!targetId) {
      return false;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      return false;
    }

    updateAnchorOffset();
    temporarilyDisableSnap();

    const headerOffset = header ? Math.ceil(header.getBoundingClientRect().height) + 12 : 12;
    const targetTop = window.scrollY + target.getBoundingClientRect().top - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: reducedMotion ? 'auto' : behavior
    });

    return true;
  };

  updateAnchorOffset();
  window.addEventListener('resize', updateAnchorOffset, { passive: true });
  window.addEventListener('load', updateAnchorOffset);

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateAnchorOffset).catch(() => {});
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="#"]');
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }
    if (link.hasAttribute('data-booking-open')) {
      return;
    }

    const url = new URL(link.href, window.location.href);
    const isSamePage = url.origin === window.location.origin
      && url.pathname === window.location.pathname
      && url.hash;

    if (!isSamePage) {
      return;
    }

    event.preventDefault();
    if (window.location.hash !== url.hash) {
      history.pushState(null, '', url.hash);
    }

    scrollToHash(url.hash);
  });

  if (window.location.hash) {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        scrollToHash(window.location.hash, 'auto');
      }, 40);
    });
  }

  window.addEventListener('hashchange', () => {
    scrollToHash(window.location.hash);
  });
}

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

function initBookingWidget() {
  const openTriggers = Array.from(document.querySelectorAll('[data-booking-open]'));
  const closeTrigger = document.querySelector('[data-booking-close]');
  const overlay = document.querySelector('[data-booking-overlay]');
  const modal = document.querySelector('[data-booking-modal]');

  if (!openTriggers.length || !closeTrigger || !overlay || !modal) {
    return;
  }

  const setWidgetState = (isOpen) => {
    overlay.classList.toggle('pointer-events-auto', isOpen);
    overlay.classList.toggle('opacity-100', isOpen);
    overlay.classList.toggle('opacity-0', !isOpen);

    modal.classList.toggle('pointer-events-auto', isOpen);
    modal.classList.toggle('opacity-100', isOpen);
    modal.classList.toggle('opacity-0', !isOpen);
    modal.classList.toggle('translate-y-0', isOpen);
    modal.classList.toggle('translate-y-2', !isOpen);

    document.body.classList.toggle('overflow-hidden', isOpen);
  };

  openTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (trigger.tagName === 'A') {
        event.preventDefault();
      }

      setWidgetState(true);
    });
  });

  closeTrigger.addEventListener('click', () => {
    setWidgetState(false);
  });

  overlay.addEventListener('click', () => {
    setWidgetState(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setWidgetState(false);
    }
  });
}

