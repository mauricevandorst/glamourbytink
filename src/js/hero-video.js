const video = document.querySelector("[data-hero-video]");
const overlay = document.querySelector("[data-hero-overlay]");

if (video && overlay) {
  const revealDelayMs = 900;
  let revealed = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    video.classList.remove("opacity-0");
    overlay.classList.remove("opacity-0");
  };

  const scheduleReveal = () => {
    window.setTimeout(reveal, revealDelayMs);
  };

  if (video.readyState >= 2) {
    scheduleReveal();
  } else {
    video.addEventListener(
      "canplay",
      () => {
        scheduleReveal();
      },
      { once: true }
    );
  }
}
