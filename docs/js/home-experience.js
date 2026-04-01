document.addEventListener('DOMContentLoaded', () => {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tabletQuery = window.matchMedia('(min-width: 768px)');
  const desktopQuery = window.matchMedia('(min-width: 1024px)');
  const reducedMotion = reducedMotionQuery.matches;

  initHeaderState();
  initPanelVisibilityObserver();
  initStoryPanelProgress();
  initStoryPanelCopyEqualHeight();
  initSplitVisualSync();
  initShowcaseActivation();
  initHeroReadyState(reducedMotion);
  initRevealObserver(reducedMotion);
  initParallaxSystem({ reducedMotion, tabletQuery, desktopQuery });
  initStorySectionFade({ reducedMotion });
  initCursorGlow(reducedMotion);
  initScrollIndicatorMotion({ reducedMotion });

  if (reducedMotion) {
    initReducedMotion();
  }
});

function initHeroReadyState(reducedMotion) {
  if (reducedMotion) {
    document.body.classList.add('is-ready');
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('is-ready');
    });
  });
}

function initRevealObserver(reducedMotion) {
  const selectors = [
    '.metric-card',
    '.hero-note',
    '.separator-copy',
    '.visual-stage',
    '.split-heading',
    '.section-intro',
    '.service-step',
    '.showcase-heading',
    '.showcase-item',
    '.stack-card',
    '.cta-shell',
    '.cta-card'
  ];

  const elements = [...new Set(selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))))];
  if (!elements.length) {
    return;
  }

  elements.forEach((element) => element.classList.add('reveal-on-scroll'));

  if (reducedMotion) {
    elements.forEach((element) => element.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -10% 0px'
    }
  );

  elements.forEach((element) => observer.observe(element));
}

function initParallaxSystem({ reducedMotion, tabletQuery, desktopQuery }) {
  const layers = Array.from(document.querySelectorAll('[data-parallax-layer]'));
  if (!layers.length) {
    return;
  }

  const activeLayers = new Set(layers);
  let framePending = false;

  const getMode = () => {
    if (!tabletQuery.matches) {
      return 'mobile';
    }

    return desktopQuery.matches ? 'desktop' : 'tablet';
  };

  const getSpeed = (layer, mode) => {
    const desktopSpeed = Number.parseFloat(layer.dataset.parallaxSpeed || '0');
    const tabletSpeed = Number.parseFloat(layer.dataset.parallaxTablet || `${desktopSpeed}`);
    const mobileFallback = tabletSpeed !== 0 ? tabletSpeed : desktopSpeed;
    const mobileSpeed = Number.parseFloat(layer.dataset.parallaxMobile || `${mobileFallback}`);

    if (mode === 'mobile') {
      return mobileSpeed;
    }

    return mode === 'desktop' ? desktopSpeed : tabletSpeed;
  };

  const setOffset = (layer, offset) => {
    layer.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
  };

  const update = () => {
    framePending = false;

    const mode = getMode();
    if (reducedMotion) {
      layers.forEach((layer) => setOffset(layer, 0));
      return;
    }

    const viewportHeight = window.innerHeight;
    const layersToUpdate = mode === 'mobile' ? layers : activeLayers;

    layersToUpdate.forEach((layer) => {
      const speed = getSpeed(layer, mode);
      if (!speed) {
        setOffset(layer, 0);
        return;
      }

      const rect = layer.getBoundingClientRect();
      const distanceFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;
      const maxShift = Number.parseFloat(layer.dataset.parallaxMax || '') || Math.max(18, rect.height * 0.12);
      const offset = Math.max(-maxShift, Math.min(maxShift, distanceFromCenter * speed));

      setOffset(layer, offset);
    });
  };

  const scheduleUpdate = () => {
    if (framePending) {
      return;
    }

    framePending = true;
    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeLayers.add(entry.target);
          return;
        }

        activeLayers.delete(entry.target);
      });

      scheduleUpdate();
    },
    {
      rootMargin: '20% 0px 20% 0px'
    }
  );

  layers.forEach((layer) => observer.observe(layer));

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate, { passive: true });
  tabletQuery.addEventListener('change', scheduleUpdate);
  desktopQuery.addEventListener('change', scheduleUpdate);

  scheduleUpdate();
}

function initHeaderState() {
  const header = document.querySelector('.site-header');
  const storySection = document.querySelector('.story-section');
  if (!header) {
    return;
  }

  const syncHeader = () => {
    if (!storySection) {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
      return;
    }

    const rect = storySection.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
    header.classList.toggle('is-scrolled', progress >= 0.08);
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

function initPanelVisibilityObserver() {
  const panels = document.querySelectorAll('.panel-section');
  if (!panels.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting && entry.intersectionRatio >= 0.3);
      });
    },
    {
      threshold: [0.3, 0.5, 0.7]
    }
  );

  panels.forEach((panel) => observer.observe(panel));
}

function initStoryPanelProgress() {
  const storyPanels = document.querySelectorAll('.story-panel');
  const storyRail = document.querySelector('.story-panels');
  const label = document.querySelector('[data-panel-current]');

  if (!storyRail || !storyPanels.length || !label) {
    return;
  }

  const updateLabel = () => {
    let activeIndex = 0;
    let bestVisibility = 0;

    storyPanels.forEach((panel, index) => {
      const rect = panel.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const visibility = visibleWidth / Math.max(1, rect.width);

      if (visibility > bestVisibility) {
        bestVisibility = visibility;
        activeIndex = index;
      }
    });

    label.textContent = String(activeIndex + 1).padStart(2, '0');
  };

  updateLabel();
  storyRail.addEventListener('scroll', updateLabel, { passive: true });
  window.addEventListener('resize', updateLabel);
}

function initStoryPanelCopyEqualHeight() {
  const copies = Array.from(document.querySelectorAll('.story-panel .panel-copy'));
  if (copies.length < 2) {
    return;
  }

  let framePending = false;

  const applyEqualHeight = () => {
    framePending = false;

    copies.forEach((copy) => {
      copy.style.height = 'auto';
    });

    const tallestHeight = Math.ceil(
      copies.reduce((maxHeight, copy) => Math.max(maxHeight, copy.scrollHeight), 0)
    );

    copies.forEach((copy) => {
      copy.style.height = `${tallestHeight}px`;
    });
  };

  const scheduleApply = () => {
    if (framePending) {
      return;
    }

    framePending = true;
    requestAnimationFrame(applyEqualHeight);
  };

  window.addEventListener('resize', scheduleApply, { passive: true });
  window.addEventListener('orientationchange', scheduleApply, { passive: true });

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      scheduleApply();
    });

    copies.forEach((copy) => resizeObserver.observe(copy));
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleApply).catch(() => {});
  }

  scheduleApply();
}

function initSplitVisualSync() {
  const steps = document.querySelectorAll('.service-step');
  const visuals = document.querySelectorAll('.visual-item');

  if (!steps.length || !visuals.length) {
    return;
  }

  const setActive = (visualId) => {
    steps.forEach((step) => {
      step.classList.toggle('is-active', step.dataset.visual === visualId);
    });

    visuals.forEach((visual) => {
      visual.classList.toggle('is-active', visual.dataset.visual === visualId);
    });
  };

  setActive(steps[0].dataset.visual);

  const observer = new IntersectionObserver(
    (entries) => {
      const topHit = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (topHit && topHit.target.dataset.visual) {
        setActive(topHit.target.dataset.visual);
      }
    },
    {
      threshold: [0.35, 0.55, 0.75]
    }
  );

  steps.forEach((step) => {
    observer.observe(step);
    step.addEventListener('mouseenter', () => setActive(step.dataset.visual));
    step.addEventListener('focusin', () => setActive(step.dataset.visual));
  });
}

function initShowcaseActivation() {
  const items = document.querySelectorAll('.showcase-item');
  if (!items.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-active', entry.isIntersecting && entry.intersectionRatio >= 0.6);
      });
    },
    {
      threshold: [0.4, 0.6, 0.8]
    }
  );

  items.forEach((item) => observer.observe(item));
}

function initStorySectionFade({ reducedMotion }) {
  const storySection = document.querySelector('.story-section');
  if (!storySection) {
    return;
  }

  let framePending = false;

  const update = () => {
    framePending = false;

    if (reducedMotion) {
      storySection.style.setProperty('--story-fade-progress', '1');
      return;
    }

    const rect = storySection.getBoundingClientRect();
    const fadeStart = window.innerHeight * 0.4;
    const fadeTravel = Math.max(140, Math.min(window.innerHeight * 0.36, 320));
    const progress = Math.max(0, Math.min(1, (fadeStart - rect.top) / fadeTravel));
    storySection.style.setProperty('--story-fade-progress', progress.toFixed(3));
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

function initCursorGlow(reducedMotion) {
  const cursor = document.querySelector('.cursor-glow');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!cursor || reducedMotion || coarsePointer) {
    return;
  }

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;
  let frameId = null;

  const render = () => {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;

    cursor.style.opacity = '1';
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate3d(-50%, -50%, 0)`;

    if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
      frameId = requestAnimationFrame(render);
      return;
    }

    frameId = null;
  };

  window.addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;

    if (!frameId) {
      frameId = requestAnimationFrame(render);
    }
  });

  window.addEventListener('pointerleave', () => {
    cursor.style.opacity = '0';
  });
}

function initScrollIndicatorMotion({ reducedMotion }) {
  const indicator = document.querySelector('[data-scroll-indicator]');
  const heroSection = document.querySelector('.hero-scene');
  const indicatorLabel = indicator?.querySelector('p');
  const indicatorIcon = indicator?.querySelector('svg');

  if (!indicator || !heroSection) {
    return;
  }

  indicator.style.willChange = 'transform, opacity';

  if (reducedMotion) {
    indicator.style.transform = 'translate3d(0, 0, 0)';
    if (indicatorLabel) {
      indicatorLabel.style.transform = 'translate3d(0, 0, 0)';
      indicatorLabel.style.opacity = '';
    }

    if (indicatorIcon) {
      indicatorIcon.style.transform = 'translate3d(0, 0, 0)';
      indicatorIcon.style.opacity = '';
    }
    return;
  }

  let framePending = false;
  let loopFrameId = null;
  const loopActiveMs = 1400;
  const loopPauseMs = 3000;
  const loopCycleMs = loopActiveMs + loopPauseMs;

  if (indicatorLabel) {
    indicatorLabel.style.transform = 'translate3d(0, 0, 0)';
    indicatorLabel.style.opacity = '';
  }

  const animateLoop = (time) => {
    const loopTime = time % loopCycleMs;
    let iconY = 0;
    let iconScale = 1;

    if (loopTime <= loopActiveMs) {
      const activeProgress = loopTime / loopActiveMs;
      if (activeProgress <= 0.35) {
        const riseProgress = activeProgress / 0.35;
        iconY = -3.2 * riseProgress;
        iconScale = 1 + 0.02 * riseProgress;
      } else {
        const returnProgress = (activeProgress - 0.35) / 0.65;
        iconY = -3.2 * (1 - returnProgress);
        iconScale = 1.02 - 0.02 * returnProgress;
      }
    }

    if (indicatorIcon) {
      indicatorIcon.style.transform = `translate3d(0, ${iconY.toFixed(2)}px, 0) scale(${iconScale.toFixed(4)})`;
      indicatorIcon.style.opacity = '';
    }

    loopFrameId = requestAnimationFrame(animateLoop);
  };

  const update = () => {
    framePending = false;

    const heroRect = heroSection.getBoundingClientRect();
    const heroTravel = Math.max(1, heroRect.height * 0.9);
    const heroProgress = Math.max(0, Math.min(1, -heroRect.top / heroTravel));
    const fadeStart = 100;
    const fadeEnd = 340;
    const fadeProgress = Math.max(0, Math.min(1, (window.scrollY - fadeStart) / (fadeEnd - fadeStart)));
    const opacity = 1 - fadeProgress;
    const fadeDropOffset = fadeProgress * 10;
    const offsetY = heroProgress * 24 + fadeDropOffset;

    indicator.style.transform = `translate3d(0, ${offsetY.toFixed(2)}px, 0)`;
    indicator.style.opacity = opacity.toFixed(3);
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

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (loopFrameId) {
        cancelAnimationFrame(loopFrameId);
        loopFrameId = null;
      }
      return;
    }

    if (!loopFrameId) {
      loopFrameId = requestAnimationFrame(animateLoop);
    }
  });

  scheduleUpdate();
  loopFrameId = requestAnimationFrame(animateLoop);
}

function initReducedMotion() {
  document.documentElement.classList.add('reduced-motion');
  document.body.classList.add('is-ready');

  document.querySelectorAll('.panel-section').forEach((panel) => {
    panel.classList.add('is-visible');
  });

  document.querySelectorAll('.reveal-on-scroll').forEach((element) => {
    element.classList.add('is-revealed');
  });

  document.querySelectorAll('.visual-item').forEach((visual, index) => {
    visual.classList.toggle('is-active', index === 0);
  });
}
