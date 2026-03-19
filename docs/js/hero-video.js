const video = document.querySelector("[data-hero-video]");
const overlay = document.querySelector("[data-hero-overlay]");

if (video && overlay) {
  const revealDelayMs = 900;
  let revealed = false;

  const attemptPlay = () => {
    if (video.ended || video.currentTime >= (video.duration || 0) - 0.05) {
      video.currentTime = 0;
    }
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    video.classList.remove("opacity-0");
    overlay.classList.remove("opacity-0");
    attemptPlay();
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

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      attemptPlay();
    }
  });

  window.addEventListener("focus", () => {
    attemptPlay();
  });

  video.addEventListener("ended", () => {
    attemptPlay();
  });
}
