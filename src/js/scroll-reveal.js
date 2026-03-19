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
  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const sparkleStates = new WeakMap();

  const getSparkleLayer = (element) => {
    let layer = element.querySelector(":scope > [data-sparkle-layer]");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.dataset.sparkleLayer = "true";
    layer.className = "pointer-events-none absolute inset-0 overflow-visible";
    element.appendChild(layer);
    return layer;
  };

  const buildGlow = (element) => {
    const existing = element.querySelector(":scope > [data-sparkle-glow]");
    if (existing) return existing;
    const glow = document.createElement("div");
    glow.dataset.sparkleGlow = "true";
    glow.className = "pointer-events-none absolute inset-0 mix-blend-screen";
    glow.style.opacity = "0";
    glow.style.background =
      "radial-gradient(circle at 30% 20%, rgba(255, 243, 206, 0.75), rgba(255, 228, 159, 0.35) 45%, rgba(255, 228, 159, 0) 70%)";

    const target = element.querySelector("img, picture, video") || element;
    const targetRadius = window.getComputedStyle(target).borderRadius;
    if (targetRadius) glow.style.borderRadius = targetRadius;
    const layer = element.querySelector(":scope > [data-sparkle-layer]");
    if (layer) {
      element.insertBefore(glow, layer);
    } else {
      element.appendChild(glow);
    }
    return glow;
  };

  const triggerSparkleTrail = (element) => {
    const glow = buildGlow(element);
    const layer = getSparkleLayer(element);

    glow.animate(
      [{ opacity: 0 }, { opacity: 0.55, offset: 0.35 }, { opacity: 0 }],
      { duration: 2850, easing: "ease-out", fill: "forwards" }
    );

    const sparkleCount = 12;
    const colors = [
      "rgba(255, 244, 210, 0.95)",
      "rgba(255, 228, 159, 0.9)",
      "rgba(252, 216, 140, 0.9)",
    ];

    for (let i = 0; i < sparkleCount; i += 1) {
      const sparkle = document.createElement("span");
      const size = randomBetween(4, 9);
      const left = randomBetween(10, 88);
      const top = randomBetween(8, 85);
      const color = colors[Math.floor(randomBetween(0, colors.length))];
      sparkle.className = "absolute rounded-full mix-blend-screen";
      sparkle.style.left = `${left}%`;
      sparkle.style.top = `${top}%`;
      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkle.style.opacity = "0";
      sparkle.style.background = `radial-gradient(circle, ${color} 0%, rgba(255, 233, 180, 0.35) 60%, rgba(255, 233, 180, 0) 75%)`;
      sparkle.style.boxShadow = `0 0 ${size * 2}px rgba(255, 214, 120, 0.65)`;
      sparkle.style.filter = "blur(0.2px)";
      layer.appendChild(sparkle);

      const driftX = randomBetween(-18, 18);
      const driftY = randomBetween(-70, -32);
      const duration = randomBetween(2400, 3600);
      const delay = randomBetween(0, 320);

      const animation = sparkle.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(0.65)", opacity: 0 },
          { opacity: 1, offset: 0.35 },
          {
            transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(1.05)`,
            opacity: 0,
          },
        ],
        { duration, delay, easing: "cubic-bezier(0.12, 1, 0.26, 1)", fill: "forwards" }
      );

      animation.addEventListener("finish", () => {
        sparkle.remove();
      });
    }
  };

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

      if (element.dataset.sparkleTrail !== undefined) {
        const now = performance.now();
        const state = sparkleStates.get(element) || { armed: true, last: 0 };
        if (progress < 0.12) {
          state.armed = true;
        }
        if (progress > 0.35 && state.armed && now - state.last > 1600) {
          state.armed = false;
          state.last = now;
          triggerSparkleTrail(element);
        }
        sparkleStates.set(element, state);
      }
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
