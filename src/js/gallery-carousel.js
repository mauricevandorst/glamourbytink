const carousels = document.querySelectorAll('[data-carousel]');

const getStepSize = (track) => {
  const firstItem = track.querySelector('article');
  if (!firstItem) {
    return 0;
  }

  const styles = window.getComputedStyle(track);
  const gapValue = parseFloat(styles.columnGap || styles.gap || '0');
  return firstItem.getBoundingClientRect().width + gapValue;
};

carousels.forEach((carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const prevButton = carousel.querySelector('[data-carousel-prev]');
  const nextButton = carousel.querySelector('[data-carousel-next]');

  if (!track || !prevButton || !nextButton) {
    return;
  }

  let isDragging = false;
  let isPointerDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let didDrag = false;

  const scrollByStep = (direction) => {
    const step = getStepSize(track);
    if (!step) {
      return;
    }
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  prevButton.addEventListener('click', () => scrollByStep(-1));
  nextButton.addEventListener('click', () => scrollByStep(1));

  const isLargeScreen = () => window.matchMedia('(min-width: 1024px)').matches;

  const onPointerDown = (event) => {
    if (!isLargeScreen()) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    isPointerDown = true;
    didDrag = false;
    startX = event.clientX;
    startScrollLeft = track.scrollLeft;
  };

  const onPointerMove = (event) => {
    if (!isPointerDown) {
      return;
    }
    const delta = event.clientX - startX;
    if (!isDragging && Math.abs(delta) > 6) {
      isDragging = true;
      didDrag = true;
      track.style.cursor = 'grabbing';
      track.setPointerCapture(event.pointerId);
    }
    if (isDragging) {
      track.scrollLeft = startScrollLeft - delta;
    }
  };

  const stopDragging = (event) => {
    if (!isPointerDown) {
      return;
    }
    isDragging = false;
    isPointerDown = false;
    track.style.cursor = '';
    if (event && track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
  };

  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', stopDragging);
  track.addEventListener('pointerleave', stopDragging);
  track.addEventListener('pointercancel', stopDragging);
  track.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener(
    'click',
    (event) => {
      if (didDrag) {
        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
      }
    },
    true
  );
});
