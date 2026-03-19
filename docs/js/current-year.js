(() => {
  const currentYear = new Date().getFullYear().toString();
  const targets = document.querySelectorAll("[data-current-year]");

  targets.forEach((target) => {
    target.textContent = currentYear;
  });
})();
