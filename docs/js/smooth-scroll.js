(() => {
  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const update = () => {
    if (mediaQuery.matches) {
      root.classList.remove("scroll-smooth");
      return;
    }
    root.classList.add("scroll-smooth");
  };

  update();
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", update);
  } else {
    mediaQuery.addListener(update);
  }
})();
