const CONFIG = {
  reviewsEndpoint: "./assets/files/google-reviews.json",
  googleIconPath: "./assets/icons/google-icon.jpg",
  googleReviewsUrl: "https://www.google.com/search?q=Oottattattoo+Assendelft",
  carouselLockMs: 260,
  swipeThresholdPx: 40,
  maxVisibleReviews: 20,
  minRating: 4,
  cardsPerView: {
    sm: 2,
    lg: 3,
  },
  snippetCharLimit: 120,
  noDateLabel: "Onbekende datum",
  noScoreLabel: "Nog geen score beschikbaar.",
  readMoreLabel: "Lees meer",
  readLessLabel: "Lees minder",
  emptySnippetLabel: "(geen tekst)",
  ctaTitle: "Meer reviews lezen?",
  ctaDescription: "Bekijk alle Google reviews of lees meer over het bedrijf op onze pagina.",
  ctaLinkLabel: "Bekijk op Google",
};

const REVIEWS_ENDPOINT = CONFIG.reviewsEndpoint;
const GOOGLE_ICON_PATH = CONFIG.googleIconPath;
const GOOGLE_REVIEWS_URL = CONFIG.googleReviewsUrl;

const listElement = document.getElementById("reviews-list");
const summaryElement = document.getElementById("reviews-summary");
const prevButton = document.getElementById("reviews-prev");
const nextButton = document.getElementById("reviews-next");
const dotsElement = document.getElementById("reviews-dots");
const viewportElement = listElement?.parentElement;
const CAROUSEL_LOCK_MS = CONFIG.carouselLockMs;
const SWIPE_THRESHOLD_PX = CONFIG.swipeThresholdPx;

let carouselPage = 0;
let pageStartIndexes = [];
let isCarouselLocked = false;
let carouselLockTimer = null;
let touchStartX = 0;
let touchStartY = 0;

const SVG_NS = "http://www.w3.org/2000/svg";
const STAR_PATH = "M16.0005 0L21.4392 9.27275L32.0005 11.5439L24.8005 19.5459L25.889 30.2222L16.0005 25.895L6.11194 30.2222L7.20049 19.5459L0.000488281 11.5439L10.5618 9.27275L16.0005 0Z";

const createStar = (filled) => {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 -0.5 32 32");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("inline-block", "size-3", "shrink-0");

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", STAR_PATH);
  path.setAttribute("fill", filled ? "#FFCB45" : "none");
  path.setAttribute("stroke", "#FFCB45");
  path.setAttribute("stroke-width", filled ? "0" : "2");

  svg.appendChild(path);
  return svg;
};

const createStars = (count, total = 5) => {
  const wrap = document.createElement("span");
  wrap.className = "inline-flex items-center gap-0.5";
  wrap.setAttribute("aria-label", `${count} van ${total} sterren`);

  for (let i = 1; i <= total; i++) {
    wrap.appendChild(createStar(i <= count));
  }

  return wrap;
};

const truncateSnippet = (value) => {
  const text = (value || "").trim();

  if (text.length <= CONFIG.snippetCharLimit) {
    return {
      displayText: text,
      hasOverflow: false,
    };
  }

  const clipped = text.slice(0, CONFIG.snippetCharLimit).trimEnd();

  return {
    displayText: `${clipped}...`,
    hasOverflow: true,
  };
};

const translateDate = (date) => {
  if (!date) {
    return CONFIG.noDateLabel;
  }

  return date
    .replace(/^an? hour ago$/i, "een uur geleden")
    .replace(/^(\d+) hours? ago$/i, (_, n) => `${n} uur geleden`)
    .replace(/^an? day ago$/i, "een dag geleden")
    .replace(/^(\d+) days? ago$/i, (_, n) => `${n} dagen geleden`)
    .replace(/^an? week ago$/i, "een week geleden")
    .replace(/^(\d+) weeks? ago$/i, (_, n) => `${n} weken geleden`)
    .replace(/^an? month ago$/i, "een maand geleden")
    .replace(/^(\d+) months? ago$/i, (_, n) => `${n} maanden geleden`)
    .replace(/^an? year ago$/i, "een jaar geleden")
    .replace(/^(\d+) years? ago$/i, (_, n) => `${n} jaar geleden`);
};

const renderReviewSummary = (reviews) => {
  const ratings = reviews
    .map((review) => Number(review.rating))
    .filter((rating) => Number.isFinite(rating));

  if (!summaryElement) {
    return;
  }

  if (!ratings.length) {
    summaryElement.textContent = CONFIG.noScoreLabel;
    return;
  }

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const averageLabel = average.toFixed(1).replace(".", ",");
  const stars = Math.max(0, Math.min(5, Math.round(average)));

  summaryElement.innerHTML = "";

  const scoreText = document.createElement("span");
  scoreText.className = "font-semibold";
  scoreText.textContent = averageLabel;

  const separator = document.createElement("a");
  separator.className = "text-blue-300 underline";
  separator.href = GOOGLE_REVIEWS_URL;
  separator.target = "_blank";
  separator.rel = "noopener noreferrer";
  separator.textContent = `${reviews.length} reviews`;

  summaryElement.classList.add("flex", "items-center", "gap-2", "md:justify-center");
  summaryElement.append(scoreText, createStars(stars), separator);
};

const renderReviewCard = (review) => {
  const card = document.createElement("article");
  card.className =
    "w-full shrink-0 rounded-xl border border-stone-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]";

  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-3";

  const authorWrap = document.createElement("div");
  authorWrap.className = "flex items-center gap-3";

  const avatar = document.createElement("img");
  avatar.className = "size-12 rounded-full border border-stone-200 object-cover";
  avatar.loading = "lazy";
  avatar.alt = "";
  avatar.referrerPolicy = "no-referrer";

  if (review.user?.thumbnail) {
    avatar.src = review.user.thumbnail;
  } else {
    avatar.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='100%25' height='100%25' fill='%2322262b'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23f5f5f5' font-size='18' font-family='Arial'%3E%3F%3C/text%3E%3C/svg%3E";
  }

  avatar.addEventListener("error", () => {
    const initial = (review.user?.name || "?").trim().charAt(0).toUpperCase() || "?";
    avatar.src =
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='100%25' height='100%25' fill='%2322262b'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23f5f5f5' font-size='18' font-family='Arial'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
  });

  const author = document.createElement("p");
  author.className = "text-xs font-semibold text-stone-900 sm:text-sm";
  author.textContent = review.user?.name || "Anonieme gebruiker";

  const date = document.createElement("p");
  date.className = "mt-0.5 text-[11px] text-stone-500 sm:text-xs";
  date.textContent = translateDate(review.date);

  const authorMeta = document.createElement("div");
  authorMeta.append(author, date);
  authorWrap.append(avatar, authorMeta);

  const source = document.createElement("img");
  source.className = "size-6 rounded-full object-cover";
  source.src = GOOGLE_ICON_PATH;
  source.alt = "Google";
  source.loading = "lazy";

  header.append(authorWrap, source);

  const rating = document.createElement("p");
  rating.className = "mt-3";
  const stars = Math.max(0, Math.min(5, Number(review.rating) || 0));
  rating.appendChild(createStars(stars));

  const textWrap = document.createElement("div");
  textWrap.className = "mt-3";

  const text = document.createElement("p");
  text.className = "overflow-hidden text-xs leading-relaxed text-stone-700 transition-[max-height] duration-300 ease-out sm:text-sm";
  text.dataset.reviewText = "false";
  text.dataset.expanded = "false";
  const rawSnippet = (review.snippet || "").trim();
  const hasSnippet = rawSnippet.length > 0;
  const snippetText = hasSnippet ? rawSnippet : CONFIG.emptySnippetLabel;
  const { displayText, hasOverflow } = truncateSnippet(rawSnippet);

  if (hasSnippet) {
    text.dataset.reviewText = "true";
  }

  text.textContent = hasSnippet ? displayText : snippetText;
  textWrap.appendChild(text);

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className =
    "mt-2 text-[11px] font-medium text-accent transition-colors duration-200 hover:text-black sm:text-xs";
  toggleButton.textContent = CONFIG.readMoreLabel;
  toggleButton.dataset.reviewToggle = "true";
  toggleButton.hidden = !hasOverflow;
  toggleButton.setAttribute("aria-expanded", "false");

  if (!hasSnippet) {
    card.append(header, rating, textWrap);
    return card;
  }

  toggleButton.addEventListener("click", () => {
    const isExpanded = text.dataset.expanded === "true";

    if (isExpanded) {
      const collapsedHeight = Number(text.dataset.collapsedHeight);
      text.style.maxHeight = `${text.scrollHeight}px`;
      void text.offsetHeight;
      text.style.maxHeight = `${collapsedHeight}px`;
      text.dataset.expanded = "false";
      toggleButton.textContent = CONFIG.readMoreLabel;
      toggleButton.setAttribute("aria-expanded", "false");
      text.addEventListener("transitionend", () => {
        text.textContent = displayText;
        text.style.maxHeight = "";
      }, { once: true });
      return;
    }

    text.dataset.collapsedHeight = String(text.offsetHeight);
    const collapsedHeight = text.offsetHeight;
    text.textContent = rawSnippet;
    const fullHeight = text.scrollHeight;
    text.style.maxHeight = `${collapsedHeight}px`;
    void text.offsetHeight;
    text.style.maxHeight = `${fullHeight}px`;
    text.dataset.expanded = "true";
    toggleButton.textContent = CONFIG.readLessLabel;
    toggleButton.setAttribute("aria-expanded", "true");
    text.addEventListener("transitionend", () => {
      text.style.maxHeight = "";
    }, { once: true });
  });

  card.append(header, rating, textWrap, toggleButton);
  return card;
};

const renderCtaCard = () => {
  const card = document.createElement("article");
  card.className =
    "w-full shrink-0 rounded-xl border border-accent/30 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] min-h-[220px] flex flex-col justify-center";

  const logo = document.createElement("img");
  logo.className = "mb-3 size-8 rounded-full object-cover";
  logo.src = GOOGLE_ICON_PATH;
  logo.alt = "Google";
  logo.loading = "lazy";

  const title = document.createElement("p");
  title.className = "text-xs font-semibold text-stone-900 sm:text-sm";
  title.textContent = CONFIG.ctaTitle;

  const description = document.createElement("p");
  description.className = "mt-2 text-xs leading-relaxed text-stone-700 sm:text-sm";
  description.textContent = CONFIG.ctaDescription;

  const link = document.createElement("a");
  link.className =
    "mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-accent underline transition-colors duration-200 hover:text-black sm:text-xs";
  link.href = GOOGLE_REVIEWS_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = CONFIG.ctaLinkLabel;

  card.append(logo, title, description, link);
  return card;
};

const getCardsPerView = () => {
  if (window.innerWidth >= 1024) {
    return CONFIG.cardsPerView.lg;
  }

  if (window.innerWidth >= 640) {
    return CONFIG.cardsPerView.sm;
  }

  return 1;
};

const buildPageStarts = (totalCards) => {
  const cardsPerView = getCardsPerView();
  const starts = [];
  const maxStartIndex = Math.max(totalCards - cardsPerView, 0);

  for (let index = 0; index <= maxStartIndex; index += 1) {
    starts.push(index);
  }

  return starts;
};

const renderDots = () => {
  dotsElement.innerHTML = "";

  pageStartIndexes.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className =
      "h-2 w-2 rounded-full border border-white/40 transition-all duration-300";
    dot.setAttribute("aria-label", `Ga naar pagina ${index + 1}`);
    dot.addEventListener("click", () => {
      goToPage(index);
    });
    dotsElement.appendChild(dot);
  });
};

const updateControls = () => {
  const isFirst = carouselPage <= 0;
  const isLast = carouselPage >= pageStartIndexes.length - 1;

  prevButton.disabled = isFirst;
  nextButton.disabled = isLast;

  [...dotsElement.children].forEach((dot, index) => {
    if (index === carouselPage) {
      dot.className =
        "h-2 w-6 rounded-full border border-white bg-white/90 transition-all duration-300";
      return;
    }

    dot.className =
      "h-2 w-2 rounded-full border border-white/40 transition-all duration-300";
  });
};

const lockCarouselNavigation = () => {
  isCarouselLocked = true;

  if (carouselLockTimer) {
    clearTimeout(carouselLockTimer);
  }

  carouselLockTimer = setTimeout(() => {
    isCarouselLocked = false;
    updateControls();
  }, CAROUSEL_LOCK_MS);
};

const goToPage = (targetPage, options = {}) => {
  const force = options.force === true;

  if (!pageStartIndexes.length) {
    return;
  }

  if (isCarouselLocked && !force) {
    return;
  }

  const maxPage = pageStartIndexes.length - 1;
  const nextPage = Math.min(Math.max(targetPage, 0), maxPage);

  if (nextPage === carouselPage && !force) {
    return;
  }

  carouselPage = nextPage;

  const startIndex = pageStartIndexes[carouselPage];
  const targetCard = listElement.children[startIndex];
  const offsetLeft = targetCard ? targetCard.offsetLeft : 0;

  if (!force) {
    lockCarouselNavigation();
  }

  listElement.style.transform = `translateX(-${offsetLeft}px)`;
  updateControls();
};

const setupCarousel = () => {
  const cardCount = listElement.children.length;
  pageStartIndexes = buildPageStarts(cardCount);

  if (pageStartIndexes.length <= 1) {
    isCarouselLocked = false;
    if (carouselLockTimer) {
      clearTimeout(carouselLockTimer);
      carouselLockTimer = null;
    }
    prevButton.disabled = true;
    nextButton.disabled = true;
    dotsElement.innerHTML = "";
    listElement.style.transform = "translateX(0)";
    return;
  }

  carouselPage = Math.min(carouselPage, pageStartIndexes.length - 1);
  renderDots();
  goToPage(carouselPage, { force: true });
};

const renderReviews = (reviews) => {
  listElement.innerHTML = "";
  carouselPage = 0;
  listElement.style.transform = "translateX(0)";

  reviews.forEach((review) => {
    listElement.appendChild(renderReviewCard(review));
  });

  listElement.appendChild(renderCtaCard());

  setupCarousel();
};

window.addEventListener("resize", () => {
  if (!listElement.children.length) {
    return;
  }

  const previousStart = pageStartIndexes[carouselPage] || 0;
  const cardsPerView = getCardsPerView();
  pageStartIndexes = buildPageStarts(listElement.children.length);
  carouselPage = Math.floor(previousStart / cardsPerView);
  renderDots();
  goToPage(carouselPage, { force: true });
});

prevButton.addEventListener("click", () => {
  goToPage(carouselPage - 1);
});

nextButton.addEventListener("click", () => {
  goToPage(carouselPage + 1);
});

if (viewportElement) {
  viewportElement.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  viewportElement.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < SWIPE_THRESHOLD_PX || absX <= absY) {
        return;
      }

      if (deltaX < 0) {
        goToPage(carouselPage + 1);
        return;
      }

      goToPage(carouselPage - 1);
    },
    { passive: true }
  );
}

const loadReviews = async () => {
  try {
    const response = await fetch(REVIEWS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const allReviews = (Array.isArray(data.reviews) ? data.reviews : [])
      .slice()
      .sort((a, b) => new Date(b.iso_date ?? 0) - new Date(a.iso_date ?? 0));

    const visibleReviews = allReviews.filter((r) => Number(r.rating) >= CONFIG.minRating).slice(0, CONFIG.maxVisibleReviews);

    renderReviewSummary(allReviews);
    renderReviews(visibleReviews);

  } catch (error) {
    if (summaryElement) {
      summaryElement.textContent =
        "Kon reviews niet laden.";
    }
  }
};

loadReviews();
