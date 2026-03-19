(() => {
  const allElements = Array.from(document.querySelectorAll("[data-scroll-fade]"));
  if (!allElements.length) return;

  const elements = allElements.filter((element) => {
    if (element.closest("[data-care-viewport]")) {
      element.style.opacity = "1";
      element.style.transform = "none";
      element.style.willChange = "auto";
      return false;
    }
    return true;
  });

  if (!elements.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    elements.forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
    return;
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const getConfig = (element) => {
    const distance = Number.parseFloat(element.dataset.scrollDistance || "32");
    const axis = (element.dataset.scrollAxis || "y").toLowerCase();
    const start = Number.parseFloat(element.dataset.scrollStart || "1.0");
    const end = Number.parseFloat(element.dataset.scrollEnd || "0.5");
    return {
      distance,
      axis: axis === "x" ? "x" : "y",
      start: Number.isFinite(start) ? start : 1.0,
      end: Number.isFinite(end) ? end : 0.5,
    };
  };

  const setInitial = (element) => {
    const { distance, axis } = getConfig(element);
    const x = axis === "x" ? distance : 0;
    const y = axis === "y" ? distance : 0;
    element.style.opacity = "0";
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    element.style.willChange = "transform, opacity";
  };

  const updateBasePositions = () => {
    elements.forEach((element) => {
      const previousTransform = element.style.transform;
      element.style.transform = "none";
      const rect = element.getBoundingClientRect();
      element.dataset.scrollBaseTop = (rect.top + window.scrollY).toFixed(2);
      element.style.transform = previousTransform;
    });
  };

  updateBasePositions();
  elements.forEach(setInitial);

  const getViewportHeight = () => {
    const visualViewport = window.visualViewport;
    if (visualViewport && Number.isFinite(visualViewport.height)) {
      return visualViewport.height;
    }
    return window.innerHeight || 0;
  };

  const update = () => {
    const vh = getViewportHeight();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    elements.forEach((element) => {
      const baseTop = Number.parseFloat(element.dataset.scrollBaseTop || "");
      const rect = element.getBoundingClientRect();
      const top = Number.isFinite(baseTop) ? baseTop - scrollY : rect.top;
      const { distance, axis, start, end } = getConfig(element);
      const startPx = vh * start;
      const endPx = vh * end;
      const range = startPx - endPx || 1;
      const progressRaw = clamp((startPx - top) / range, 0, 1);
      const progress = progressRaw * progressRaw * (3 - 2 * progressRaw);
      const offset = (1 - progress) * distance;
      const x = axis === "x" ? offset : 0;
      const y = axis === "y" ? offset : 0;
      element.style.opacity = progress.toFixed(3);
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    });
  };

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  update();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", () => {
    updateBasePositions();
    update();
  });
  window.addEventListener("load", () => {
    updateBasePositions();
    update();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", requestTick, { passive: true });
  }

  if ("ResizeObserver" in window) {
    let resizeTicking = false;
    const scheduleResizeUpdate = () => {
      if (resizeTicking) return;
      resizeTicking = true;
      window.requestAnimationFrame(() => {
        updateBasePositions();
        update();
        resizeTicking = false;
      });
    };

    const observer = new ResizeObserver(scheduleResizeUpdate);
    observer.observe(document.body);
  }
})();
