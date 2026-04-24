const CONFIG = {
    reviewsEndpoint: "./assets/files/google-reviews.json",
    googleIconPath: "./assets/icons/google-icon.jpg",
    googleReviewsUrl: "https://www.google.com/search?q=Glamour+by+Tink",
    carouselLockMs: 260,
    swipeThresholdPx: 40,
    maxVisibleReviews: 20,
    minRating: 4,
    cardsPerView: {
        md: 2,
        lg: 3,
    },
    snippetCharLimit: 120,
    noDateLabel: "Onbekende datum",
    noScoreLabel: "Nog geen score beschikbaar.",
    readMoreLabel: "Lees meer",
    readLessLabel: "Lees minder",
    emptySnippetLabel: "(geen tekst)",
    ctaTitle: "Meer reviews lezen?",
    ctaDescription: "Bekijk al onze Google reviews op onze bedrijfspagina.",
    ctaLinkLabel: "Lees meer op Google",
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
    separator.className = "text-[var(--site-accent-light)] underline";
    separator.href = GOOGLE_REVIEWS_URL;
    separator.target = "_blank";
    separator.rel = "noopener noreferrer";
    separator.textContent = `${reviews.length} reviews`;

    summaryElement.classList.add("flex", "items-center", "gap-2");
    summaryElement.append(scoreText, createStars(stars), separator);
};

// Wave SVG paths used in existing card layout
const WAVE_PATHS = [
    "M0,55 C120,10 240,10 500,55 L500,70 L0,70 Z",
    "M0,44 C96,44 150,34 214,26 C250,8 286,8 324,26 C390,42 446,46 500,40 L500,70 L0,70 Z",
    "M0,48 C85,48 110,18 195,18 C280,18 305,46 390,46 C435,46 468,34 500,34 L500,70 L0,70 Z",
];

let waveIndex = 0;

const createWaveSvg = (colorClass, path, sizeClass = "h-10") => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 500 70");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("block", "w-full", ...sizeClass.split(" "));
    svg.classList.add(...colorClass.split(" "));

    const pathEl = document.createElementNS(SVG_NS, "path");
    pathEl.setAttribute("fill", "currentColor");
    pathEl.setAttribute("d", path);
    svg.appendChild(pathEl);
    return svg;
};

const renderReviewCard = (review) => {
    const wavePath = WAVE_PATHS[waveIndex % WAVE_PATHS.length];
    waveIndex++;

    const card = document.createElement("article");
    card.className =
        "pointer-events-auto shrink-0 basis-full md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)] !p-0 !overflow-hidden !rounded-[1.35rem] backdrop-blur-[16px] bg-[var(--site-bg-card)] border border-[var(--site-line)] shadow-[var(--site-shadow)]";

    // Top section
    const top = document.createElement("div");
    top.className = "relative px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-6";

    // Google icon link
    const iconLink = document.createElement("a");
    iconLink.href = GOOGLE_REVIEWS_URL;
    iconLink.target = "_blank";
    iconLink.rel = "noopener noreferrer";
    iconLink.className = "absolute right-4 top-4 md:right-6 md:top-6";
    iconLink.setAttribute("aria-label", "Bekijk op Google");

    const googleIcon = document.createElement("img");
    googleIcon.src = GOOGLE_ICON_PATH;
    googleIcon.alt = "Google";
    googleIcon.className = "h-6 w-6 object-contain";
    googleIcon.loading = "lazy";
    iconLink.appendChild(googleIcon);

    // Quote mark
    const quote = document.createElement("p");
    quote.className = "text-[var(--site-accent-light)] text-[2rem] leading-none md:text-4xl";
    quote.innerHTML = "&ldquo;";

    // Stars
    const starsCount = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const starsEl = document.createElement("p");
    starsEl.className = "mt-2";
    starsEl.appendChild(createStars(starsCount));

    // Review text with expand/collapse
    const rawSnippet = (review.snippet || "").trim();
    const hasSnippet = rawSnippet.length > 0;
    const snippetText = hasSnippet ? rawSnippet : CONFIG.emptySnippetLabel;
    const { displayText, hasOverflow } = truncateSnippet(rawSnippet);

    const text = document.createElement("p");
    text.className = "mt-2.5 text-[0.96rem] leading-relaxed text-[#ede3da]/80 overflow-hidden transition-[max-height] duration-300 ease-out md:mt-3 md:text-lg";
    text.dataset.reviewText = hasSnippet ? "true" : "false";
    text.dataset.expanded = "false";
    text.textContent = hasSnippet ? displayText : snippetText;

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className =
        "w-full text-start mt-2 text-[0.92rem] font-medium text-[var(--site-accent-light)] transition-colors duration-200 md:text-lg";
    toggleButton.textContent = CONFIG.readMoreLabel;
    toggleButton.dataset.reviewToggle = "true";
    toggleButton.hidden = !hasOverflow;
    toggleButton.setAttribute("aria-expanded", "false");

    if (hasOverflow) {
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
    }

    top.append(iconLink, quote, starsEl, text);
    if (hasOverflow) {
        top.appendChild(toggleButton);
    }

    // Bottom section with wave dividers + author info
    const bottom = document.createElement("div");
    bottom.className = "mt-auto w-full";

    const wave1 = createWaveSvg("text-[--site-line]", wavePath, "h-8 md:h-10");
    const wave2 = createWaveSvg("text-[#141210] -mt-[31px] md:-mt-[39px]", wavePath, "h-8 md:h-10");

    const authorSection = document.createElement("div");
    authorSection.className = "relative bg-[#141210] px-4 pb-4 pt-4 text-center md:px-6 md:pb-5 md:pt-5";

    // Author avatar
    const avatar = document.createElement("img");
    avatar.className = "testimonial-avatar absolute left-1/2 -top-7 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-[#120f0d] object-cover md:-top-8 md:h-16 md:w-16 md:border-[10px]";
    avatar.loading = "lazy";
    avatar.alt = "";
    avatar.referrerPolicy = "no-referrer";

    if (review.user?.thumbnail) {
        avatar.src = review.user.thumbnail;
    } else {
        const initial = (review.user?.name || "?").trim().charAt(0).toUpperCase() || "?";
        avatar.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='100%25' height='100%25' fill='%23241c18'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23ead8c8' font-size='26' font-family='Arial'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
    }

    avatar.addEventListener("error", () => {
        const initial = (review.user?.name || "?").trim().charAt(0).toUpperCase() || "?";
        avatar.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='100%25' height='100%25' fill='%23241c18'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%23ead8c8' font-size='26' font-family='Arial'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
    });

    const authorName = document.createElement("h3");
    authorName.className = "!text-[1.05rem] !leading-tight md:!text-[1.2rem]";
    authorName.textContent = review.user?.name || "Anonieme gebruiker";

    const dateEl = document.createElement("span");
    dateEl.className = "mt-1 block text-[0.66rem] uppercase tracking-[0.14em] text-[#ead8c8]/75 md:text-[0.7rem]";
    dateEl.textContent = translateDate(review.date);

    authorSection.append(avatar, authorName, dateEl);
    bottom.append(wave1, wave2, authorSection);

    card.append(top, bottom);
    return card;
};

const renderCtaCard = () => {
    const card = document.createElement("article");
    card.className =
        "shrink-0 basis-full md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)] !p-0 !overflow-hidden !rounded-[1.35rem] backdrop-blur-[16px] bg-[var(--site-bg-card)] border border-[var(--site-line)] shadow-[var(--site-shadow)] flex flex-col justify-center";

    const inner = document.createElement("div");
    inner.className = "px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-6 flex flex-col items-start";

    const logo = document.createElement("img");
    logo.className = "mb-4 h-8 w-8 object-contain";
    logo.src = GOOGLE_ICON_PATH;
    logo.alt = "Google";
    logo.loading = "lazy";

    const title = document.createElement("p");
    title.className = "text-[1rem] font-semibold text-white leading-snug md:text-[1.1rem]";
    title.textContent = CONFIG.ctaTitle;

    const description = document.createElement("p");
    description.className = "mt-2 text-[0.9rem] leading-relaxed text-[#ede3da]/80 md:text-[0.92rem]";
    description.textContent = CONFIG.ctaDescription;

    const link = document.createElement("a");
    link.className =
        "mt-5 inline-flex items-center gap-2 rounded-[5px] border border-[#ead8c8]/20 bg-[#ead8c8]/5 px-4 py-2 text-xs font-medium text-[#ead8c8]/80 transition hover:border-[#ead8c8]/40 hover:text-white";
    link.href = GOOGLE_REVIEWS_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const linkIcon = document.createElement("img");
    linkIcon.src = GOOGLE_ICON_PATH;
    linkIcon.alt = "";
    linkIcon.className = "h-4 w-4 object-contain";
    linkIcon.loading = "lazy";
    link.append(linkIcon, document.createTextNode(CONFIG.ctaLinkLabel));

    inner.append(logo, title, description, link);
    card.appendChild(inner);
    return card;
};

const getCardsPerView = () => {
    if (window.innerWidth >= 1024) {
        return CONFIG.cardsPerView.lg;
    }

    if (window.innerWidth >= 768) {
        return CONFIG.cardsPerView.md;
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
    waveIndex = 0;
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
