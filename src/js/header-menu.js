const toggleButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobilePanel = document.querySelector("[data-mobile-panel]");
const menuItems = mobileMenu ? mobileMenu.querySelectorAll(".menu-item") : [];
const lineTop = document.querySelector("[data-line-top]");
const lineMiddle = document.querySelector("[data-line-middle]");
const lineBottom = document.querySelector("[data-line-bottom]");
const siteHeader = document.querySelector("[data-site-header]");
const phoneIcon = document.querySelector("[data-phone-icon]");

const lineLightClasses = ["bg-white"];
const lineDarkClasses = ["bg-charcoal"];
const headerShadowClass = "shadow-[0_10px_30px_rgba(68,52,32,0.12)]";

const setHamburgerColor = (isDark) => {
  if (!lineTop || !lineMiddle || !lineBottom) {
    return;
  }
  if (isDark) {
    lineTop.classList.remove(...lineLightClasses);
    lineMiddle.classList.remove(...lineLightClasses);
    lineBottom.classList.remove(...lineLightClasses);
    lineTop.classList.add(...lineDarkClasses);
    lineMiddle.classList.add(...lineDarkClasses);
    lineBottom.classList.add(...lineDarkClasses);
    return;
  }
  lineTop.classList.remove(...lineDarkClasses);
  lineMiddle.classList.remove(...lineDarkClasses);
  lineBottom.classList.remove(...lineDarkClasses);
  lineTop.classList.add(...lineLightClasses);
  lineMiddle.classList.add(...lineLightClasses);
  lineBottom.classList.add(...lineLightClasses);
};

const setToggleButtonText = (isDark) => {
  if (!toggleButton) {
    return;
  }
  if (isDark) {
    toggleButton.classList.add("text-charcoal");
    toggleButton.classList.remove("text-white");
    return;
  }
  toggleButton.classList.add("text-white");
  toggleButton.classList.remove("text-charcoal");
};

const shouldUseDarkHeader = () => window.scrollY > 12;
let applyHeaderDarkState = null;

if (toggleButton && mobileMenu && mobilePanel) {
  const openMenu = () => {
    mobileMenu.classList.remove("opacity-0", "pointer-events-none");
    mobileMenu.classList.add("opacity-100", "pointer-events-auto");
    mobilePanel.classList.remove("opacity-0", "scale-95", "translate-y-4");
    mobilePanel.classList.add("opacity-100", "scale-100", "translate-y-0");
    menuItems.forEach((item) => {
      item.classList.remove("opacity-0", "-translate-y-2");
      item.classList.add("opacity-100", "translate-y-0");
    });
    toggleButton.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
    lineTop?.classList.add("translate-y-[9px]", "rotate-45");
    lineMiddle?.classList.add("opacity-0");
    lineBottom?.classList.add("-translate-y-[9px]", "-rotate-45");
    if (applyHeaderDarkState) {
      applyHeaderDarkState(true);
    } else {
      setHamburgerColor(true);
      setToggleButtonText(true);
    }
    siteHeader?.classList.remove(headerShadowClass);
  };

  const closeMenu = () => {
    mobileMenu.classList.add("opacity-0", "pointer-events-none");
    mobileMenu.classList.remove("opacity-100", "pointer-events-auto");
    mobilePanel.classList.add("opacity-0", "scale-95", "translate-y-4");
    mobilePanel.classList.remove("opacity-100", "scale-100", "translate-y-0");
    menuItems.forEach((item) => {
      item.classList.add("opacity-0", "-translate-y-2");
      item.classList.remove("opacity-100", "translate-y-0");
    });
    toggleButton.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    lineTop?.classList.remove("translate-y-[9px]", "rotate-45");
    lineMiddle?.classList.remove("opacity-0");
    lineBottom?.classList.remove("-translate-y-[9px]", "-rotate-45");
    const useDark = siteHeader ? shouldUseDarkHeader() : false;
    if (applyHeaderDarkState) {
      applyHeaderDarkState(useDark);
    } else {
      setHamburgerColor(useDark);
      setToggleButtonText(useDark);
    }
  };

  const isOpen = () => toggleButton.getAttribute("aria-expanded") === "true";

  toggleButton.addEventListener("click", () => {
    if (isOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  mobileMenu.addEventListener("click", (event) => {
    const target = event.target;
    if (target === mobileMenu || target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!isOpen()) {
      return;
    }
    const target = event.target;
    if (!mobilePanel.contains(target) && !toggleButton.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      closeMenu();
    }
  });
}

if (siteHeader) {
  const glassClasses = [
    "bg-[#f8f3ee]",
    "border-[#e4d6c4]",
    headerShadowClass,
    "text-charcoal",
    "[&_a]:text-charcoal",
    "[&_span]:text-charcoal",
  ];
  const phoneLight = phoneIcon?.getAttribute("data-phone-light");
  const phoneDark = phoneIcon?.getAttribute("data-phone-dark");
  const togglePhoneIcon = (isDark) => {
    if (!phoneIcon) {
      return;
    }
    if (isDark && phoneDark) {
      phoneIcon.setAttribute("src", phoneDark);
      return;
    }
    if (!isDark && phoneLight) {
      phoneIcon.setAttribute("src", phoneLight);
    }
  };
  applyHeaderDarkState = (isDark) => {
    if (isDark) {
      siteHeader.classList.add(...glassClasses);
      siteHeader.classList.remove("bg-transparent", "border-transparent");
      setHamburgerColor(true);
      togglePhoneIcon(true);
      setToggleButtonText(true);
      return;
    }

    siteHeader.classList.remove(...glassClasses);
    siteHeader.classList.add("bg-transparent", "border-transparent");
    setHamburgerColor(false);
    togglePhoneIcon(false);
    setToggleButtonText(false);
  };

  const applyGlass = () => {
    applyHeaderDarkState(shouldUseDarkHeader());
  };

  let isTicking = false;
  const onScroll = () => {
    if (isTicking) {
      return;
    }
    isTicking = true;
    window.requestAnimationFrame(() => {
      applyGlass();
      isTicking = false;
    });
  };

  applyGlass();
  window.addEventListener("scroll", onScroll, { passive: true });
}
