(() => {
  const elements = Array.from(document.querySelectorAll("[data-sparkle-trail]"));
  if (!elements.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;
  const sparkleStates = new WeakMap();
  const sparkleTimeScale = 2;

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
      { duration: 2850 * sparkleTimeScale, easing: "ease-out", fill: "forwards" }
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
      const duration = randomBetween(2400, 3600) * sparkleTimeScale;
      const delay = randomBetween(0, 320) * sparkleTimeScale;

      const animation = sparkle.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(0.65)", opacity: 0 },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, offset: 0.88 },
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

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => triggerSparkleTrail(element));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const now = performance.now();
      entries.forEach((entry) => {
        const element = entry.target;
        const state = sparkleStates.get(element) || { armed: true, last: 0 };
        if (!entry.isIntersecting) {
          state.armed = true;
        } else if (state.armed && now - state.last > 1600) {
          state.armed = false;
          state.last = now;
          triggerSparkleTrail(element);
        }
        sparkleStates.set(element, state);
      });
    },
    { threshold: 0.35 }
  );

  elements.forEach((element) => observer.observe(element));
})();
