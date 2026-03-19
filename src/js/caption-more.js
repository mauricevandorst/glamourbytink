const setupCaptionMore = () => {
  const captions = document.querySelectorAll("[data-caption]");

  captions.forEach((caption) => {
    const textNode = caption.querySelector("[data-caption-text]");
    const moreButton = caption.querySelector("[data-caption-more]");

    if (!textNode || !moreButton) return;

    if (!textNode.dataset.fullText) {
      textNode.dataset.fullText = textNode.textContent.replace(/\s+/g, " ").trim();
    }

    const fullText = textNode.dataset.fullText;

    if (caption.dataset.expanded === "true") {
      textNode.textContent = fullText;
      moreButton.classList.add("hidden");
      caption.classList.remove("cursor-pointer");
      return;
    }

    textNode.textContent = fullText;
    moreButton.classList.add("hidden");

    const lineHeight = parseFloat(window.getComputedStyle(caption).lineHeight) || 16;
    const maxHeight = lineHeight * 2 + 1;

    if (caption.scrollHeight <= maxHeight) {
      moreButton.classList.add("hidden");
      caption.classList.remove("cursor-pointer");
      return;
    }

    moreButton.classList.remove("hidden");
    caption.classList.add("cursor-pointer");

    let low = 0;
    let high = fullText.length;
    let best = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      textNode.textContent = fullText.slice(0, mid).trimEnd();

      if (caption.scrollHeight <= maxHeight) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    textNode.textContent = fullText.slice(0, best).trimEnd();

    if (moreButton.dataset.bound !== "true") {
      moreButton.addEventListener("click", (event) => {
        event.preventDefault();
        caption.dataset.expanded = "true";
        textNode.textContent = fullText;
        moreButton.classList.add("hidden");
        caption.classList.remove("cursor-pointer");
      });

      moreButton.dataset.bound = "true";
    }

    if (caption.dataset.boundCaption !== "true") {
      caption.addEventListener("click", (event) => {
        const clickedMore = event.target.closest("[data-caption-more]");
        if (clickedMore) return;
        if (caption.dataset.expanded === "true") return;
        if (moreButton.classList.contains("hidden")) return;

        caption.dataset.expanded = "true";
        textNode.textContent = fullText;
        moreButton.classList.add("hidden");
        caption.classList.remove("cursor-pointer");
      });

      caption.dataset.boundCaption = "true";
    }
  });
};

setupCaptionMore();
window.addEventListener("resize", setupCaptionMore);
