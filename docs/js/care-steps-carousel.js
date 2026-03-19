(() => {
  const careCarousels = document.querySelectorAll('[data-care-carousel]');
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  careCarousels.forEach((carousel) => {
    const viewport = carousel.matches('[data-care-viewport]')
      ? carousel
      : carousel.querySelector('[data-care-viewport]');
    const container = carousel.parentElement?.parentElement ?? carousel.parentElement ?? carousel;
    const indicatorsWrap = container.querySelector('[data-care-indicators]');
    const prevButton = container.querySelector('[data-care-prev]');
    const nextButton = container.querySelector('[data-care-next]');
    const indicators = indicatorsWrap ? Array.from(indicatorsWrap.querySelectorAll('[data-care-indicator]')) : [];
    const steps = Array.from(viewport.querySelectorAll('[data-care-step]'));

    if (!viewport || indicators.length === 0) {
      return;
    }

    let stepOffsets = [];

    const getMaxScroll = () => Math.max(viewport.scrollWidth - viewport.clientWidth, 0);

    const updateIndicatorsVisibility = () => {
      if (!indicatorsWrap) {
        return;
      }
      const maxScroll = getMaxScroll();
      indicatorsWrap.classList.toggle('hidden', maxScroll <= 0);
    };

    const updateNavVisibility = () => {
      const maxScroll = getMaxScroll();
      const shouldHide = maxScroll <= 0;
      if (prevButton) {
        prevButton.dataset.hidden = shouldHide ? 'true' : 'false';
      }
      if (nextButton) {
        nextButton.dataset.hidden = shouldHide ? 'true' : 'false';
      }
    };

    const updateStepOffsets = () => {
      const viewportRect = viewport.getBoundingClientRect();
      stepOffsets = steps.map((step) => step.getBoundingClientRect().left - viewportRect.left + viewport.scrollLeft);
    };

    const setActive = (index) => {
      indicators.forEach((button, idx) => {
        const isActive = idx === index;
        button.dataset.active = isActive ? 'true' : 'false';
        if (isActive) {
          button.setAttribute('aria-current', 'true');
        } else {
          button.removeAttribute('aria-current');
        }
      });
    };

    const getIndex = () => {
      if (stepOffsets.length) {
        const current = viewport.scrollLeft;
        let closestIndex = 0;
        let closestDistance = Math.abs(current - stepOffsets[0]);
        for (let i = 1; i < stepOffsets.length; i += 1) {
          const distance = Math.abs(current - stepOffsets[i]);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
          }
        }
        return clamp(closestIndex, 0, indicators.length - 1);
      }
      const maxScroll = getMaxScroll();
      if (maxScroll <= 0) {
        return 0;
      }
      const ratio = viewport.scrollLeft / maxScroll;
      return clamp(Math.round(ratio * (indicators.length - 1)), 0, indicators.length - 1);
    };

    let rafId = 0;
    const onScroll = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        setActive(getIndex());
      });
    };

    indicators.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (stepOffsets.length) {
          viewport.scrollTo({ left: stepOffsets[index] ?? 0, behavior: 'smooth' });
          setActive(index);
          return;
        }
        const maxScroll = getMaxScroll();
        if (!maxScroll) {
          setActive(index);
          return;
        }
        const step = maxScroll / (indicators.length - 1);
        viewport.scrollTo({ left: step * index, behavior: 'smooth' });
        setActive(index);
      });
    });

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        const index = getIndex();
        const nextIndex = clamp(index - 1, 0, indicators.length - 1);
        if (stepOffsets.length) {
          viewport.scrollTo({ left: stepOffsets[nextIndex] ?? 0, behavior: 'smooth' });
          setActive(nextIndex);
          return;
        }
        const maxScroll = getMaxScroll();
        if (!maxScroll) {
          setActive(nextIndex);
          return;
        }
        const step = maxScroll / (indicators.length - 1);
        viewport.scrollTo({ left: step * nextIndex, behavior: 'smooth' });
        setActive(nextIndex);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        const index = getIndex();
        const nextIndex = clamp(index + 1, 0, indicators.length - 1);
        if (stepOffsets.length) {
          viewport.scrollTo({ left: stepOffsets[nextIndex] ?? 0, behavior: 'smooth' });
          setActive(nextIndex);
          return;
        }
        const maxScroll = getMaxScroll();
        if (!maxScroll) {
          setActive(nextIndex);
          return;
        }
        const step = maxScroll / (indicators.length - 1);
        viewport.scrollTo({ left: step * nextIndex, behavior: 'smooth' });
        setActive(nextIndex);
      });
    }

    viewport.addEventListener('scroll', onScroll);
    window.addEventListener('resize', () => {
      updateStepOffsets();
      updateIndicatorsVisibility();
      updateNavVisibility();
      setActive(getIndex());
    });

    updateStepOffsets();
    updateIndicatorsVisibility();
    updateNavVisibility();
    setActive(getIndex());
  });
})();
