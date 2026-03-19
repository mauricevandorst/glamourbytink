const INTRO_STORAGE_KEY = "oottat_intro_shown";

const overlay = document.querySelector("[data-intro-overlay]");
const logo = document.querySelector("[data-intro-logo]");

if (overlay && logo) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const alreadyShown = sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";

  if (alreadyShown || prefersReducedMotion) {
    overlay.classList.add("hidden");
  } else {
    document.body.classList.add("overflow-hidden");
    overlay.classList.remove("pointer-events-none");

    requestAnimationFrame(() => {
      overlay.classList.add("opacity-100");
      logo.classList.remove("opacity-0", "scale-90");
      logo.classList.add("opacity-100", "scale-100");
    });

    window.setTimeout(() => {
      logo.classList.remove("scale-100");
      logo.classList.add("scale-[1.35]", "opacity-0");
      overlay.classList.add("transition-opacity", "duration-700");
      overlay.classList.remove("opacity-100");
      overlay.classList.add("opacity-0");
    }, 1100);

    window.setTimeout(() => {
      overlay.classList.add("hidden", "pointer-events-none");
      document.body.classList.remove("overflow-hidden");
      sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    }, 1900);
  }
}
