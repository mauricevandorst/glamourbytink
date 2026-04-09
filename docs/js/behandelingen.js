document.addEventListener('DOMContentLoaded', () => {
  initHeaderState();
  initCursorGlow();
  initRevealObserver();
  initFaqAccordion();
  initBookingFabVisibility();
  initSalonizedServicesEmbedHeight();
});

function initHeaderState() {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }

  const syncHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

function initCursorGlow() {
  const cursor = document.querySelector('.cursor-glow');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!cursor || reducedMotion || coarsePointer) {
    return;
  }

  const particleLimit = 18;
  const particleSpawnInterval = 36;
  const activeParticles = new Set();

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;
  let previousX = currentX;
  let previousY = currentY;
  let frameId = null;
  let lastParticleTime = 0;

  const spawnParticle = (x, y, velocityX, velocityY) => {
    const particle = document.createElement('span');
    const size = 6 + Math.random() * 4.5;
    const driftX = (Math.random() - 0.5) * 16 - velocityX * 0.06;
    const driftY = -10 - Math.random() * 14 - Math.min(8, Math.abs(velocityY) * 0.05);

    particle.className = 'cursor-trail-particle cursor-trail-particle--spark';
    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);
    particle.style.setProperty('--drift-x', `${driftX.toFixed(2)}px`);
    particle.style.setProperty('--drift-y', `${driftY.toFixed(2)}px`);
    particle.style.setProperty('--particle-size', `${size.toFixed(2)}px`);
    particle.style.setProperty('--particle-duration', `${(760 + Math.random() * 420).toFixed(0)}ms`);
    particle.style.setProperty('--twinkle-rotate', `${(Math.random() * 70 - 35).toFixed(2)}deg`);

    document.body.appendChild(particle);
    activeParticles.add(particle);

    particle.addEventListener(
      'animationend',
      () => {
        activeParticles.delete(particle);
        particle.remove();
      },
      { once: true }
    );

    if (activeParticles.size > particleLimit) {
      const oldestParticle = activeParticles.values().next().value;
      if (oldestParticle) {
        activeParticles.delete(oldestParticle);
        oldestParticle.remove();
      }
    }
  };

  const render = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;

    const deltaX = currentX - previousX;
    const deltaY = currentY - previousY;
    const distance = Math.hypot(targetX - currentX, targetY - currentY);
    const rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    cursor.style.opacity = '1';
    cursor.style.setProperty('--cursor-rotation', `${rotation.toFixed(2)}deg`);
    cursor.style.setProperty('--cursor-scale', `${(1 + Math.min(0.05, distance / 520)).toFixed(3)}`);
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate3d(-50%, -50%, 0) scale(var(--cursor-scale))`;

    previousX = currentX;
    previousY = currentY;

    if (distance > 0.18) {
      frameId = requestAnimationFrame(render);
      return;
    }

    frameId = null;
  };

  window.addEventListener('pointermove', (event) => {
    const velocityX = event.clientX - targetX;
    const velocityY = event.clientY - targetY;
    const movement = Math.abs(velocityX) + Math.abs(velocityY);
    const now = performance.now();

    targetX = event.clientX;
    targetY = event.clientY;

    if (movement > 2.5 && now - lastParticleTime >= particleSpawnInterval) {
      spawnParticle(event.clientX - velocityX * 0.18, event.clientY - velocityY * 0.18, velocityX, velocityY);

      if (movement > 26) {
        spawnParticle(
          event.clientX + (Math.random() - 0.5) * 5,
          event.clientY + (Math.random() - 0.5) * 5,
          velocityX * 0.6,
          velocityY * 0.6
        );
      }

      lastParticleTime = now;
    }

    if (!frameId) {
      frameId = requestAnimationFrame(render);
    }
  });

  window.addEventListener('pointerleave', () => {
    cursor.style.opacity = '0';
    cursor.style.setProperty('--cursor-scale', '1');
  });
}

function initRevealObserver() {
  const elements = Array.from(document.querySelectorAll('.treatments-reveal'));
  if (!elements.length) {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -10% 0px'
    }
  );

  elements.forEach((element) => observer.observe(element));
}

function initFaqAccordion() {
  const faqList = document.querySelector('[data-faq-list]');
  if (!faqList) {
    return;
  }

  const triggers = Array.from(faqList.querySelectorAll('.faq-trigger'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const expandPanel = (panel) => {
    if (panel.hidden) {
      panel.hidden = false;
    }

    if (reducedMotion) {
      panel.style.removeProperty('height');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
      return;
    }

    panel.style.overflow = 'hidden';
    panel.style.height = '0px';
    panel.style.opacity = '0';
    panel.style.transition = 'height 260ms ease, opacity 220ms ease';

    // Force style sync so transition starts from 0 height.
    panel.offsetHeight;

    panel.style.height = `${panel.scrollHeight}px`;
    panel.style.opacity = '1';

    const onExpandEnd = (event) => {
      if (event.propertyName !== 'height') {
        return;
      }

      panel.style.removeProperty('height');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
      panel.style.removeProperty('opacity');
    };

    panel.addEventListener('transitionend', onExpandEnd, { once: true });
  };

  const collapsePanel = (panel) => {
    if (panel.hidden) {
      return;
    }

    if (reducedMotion) {
      panel.hidden = true;
      panel.style.removeProperty('height');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
      return;
    }

    panel.style.overflow = 'hidden';
    panel.style.height = `${panel.scrollHeight}px`;
    panel.style.opacity = '1';
    panel.style.transition = 'height 220ms ease, opacity 180ms ease';

    // Force style sync so transition starts from full height.
    panel.offsetHeight;

    panel.style.height = '0px';
    panel.style.opacity = '0';

    const onCollapseEnd = (event) => {
      if (event.propertyName !== 'height') {
        return;
      }

      panel.hidden = true;
      panel.style.removeProperty('height');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
    };

    panel.addEventListener('transitionend', onCollapseEnd, { once: true });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const panelId = trigger.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) {
        return;
      }

      // Close all other panels
      triggers.forEach((otherTrigger) => {
        if (otherTrigger !== trigger) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          const otherPanelId = otherTrigger.getAttribute('aria-controls');
          const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;
          if (otherPanel) {
            collapsePanel(otherPanel);
          }
        }
      });

      // Toggle current panel
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        collapsePanel(panel);
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        expandPanel(panel);
      }
    });
  });
}

function initSalonizedServicesEmbedHeight() {
  const embed = document.getElementById('salonized-services-embed');
  if (!embed) {
    return;
  }

  const FALLBACK_HEIGHT = 2200;
  let hasExternalResize = false;

  const applyHeight = (nextHeight) => {
    const safeHeight = Math.max(1200, Math.ceil(Number(nextHeight) || 0));
    if (!safeHeight) {
      return;
    }

    embed.style.height = `${safeHeight}px`;
  };

  const parseHeightFromPayload = (payload) => {
    if (!payload) {
      return null;
    }

    if (typeof payload === 'number') {
      return payload;
    }

    if (typeof payload === 'string') {
      const directNumeric = Number(payload);
      if (Number.isFinite(directNumeric)) {
        return directNumeric;
      }

      try {
        const parsed = JSON.parse(payload);
        return parseHeightFromPayload(parsed);
      } catch {
        return null;
      }
    }

    if (typeof payload === 'object') {
      const candidates = [
        payload.height,
        payload.iframeHeight,
        payload.contentHeight,
        payload.data?.height,
        payload.payload?.height
      ];

      for (const candidate of candidates) {
        const value = Number(candidate);
        if (Number.isFinite(value)) {
          return value;
        }
      }
    }

    return null;
  };

  window.addEventListener('message', (event) => {
    if (!event.origin || !event.origin.includes('salonized.com')) {
      return;
    }

    const externalHeight = parseHeightFromPayload(event.data);
    if (!externalHeight) {
      return;
    }

    hasExternalResize = true;
    applyHeight(externalHeight + 24);
  });

  window.setTimeout(() => {
    if (!hasExternalResize) {
      applyHeight(FALLBACK_HEIGHT);
    }
  }, 1400);
}

function initBookingFabVisibility() {
  const bookingFab = document.querySelector('[data-booking-fab]');
  if (!bookingFab) {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showThreshold = 150;
  const hideThreshold = 175;

  let isVisible = false;
  let framePending = false;

  const applyVisibility = (visible) => {
    bookingFab.style.opacity = visible ? '1' : '0';
    bookingFab.style.pointerEvents = visible ? 'auto' : 'none';
    bookingFab.style.transform = visible ? 'translate3d(0, 0, 0)' : 'translate3d(22px, 0, 0)';
  };

  bookingFab.style.willChange = 'transform, opacity';
  bookingFab.style.transition = reducedMotion
    ? 'none'
    : 'transform 0.72s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.72s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s linear';

  if (reducedMotion) {
    applyVisibility(true);
    return;
  }

  applyVisibility(false);

  const update = () => {
    framePending = false;

    const nextVisible = isVisible
      ? window.scrollY > hideThreshold
      : window.scrollY > showThreshold;

    if (nextVisible === isVisible) {
      return;
    }

    isVisible = nextVisible;
    applyVisibility(isVisible);
  };

  const scheduleUpdate = () => {
    if (framePending) {
      return;
    }

    framePending = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate, { passive: true });

  scheduleUpdate();
}

