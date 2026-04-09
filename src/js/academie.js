document.addEventListener('DOMContentLoaded', () => {
  initRevealObserver();
  initFaqAccordion();
});

function initRevealObserver() {
  const elements = Array.from(document.querySelectorAll('.treatments-reveal'));
  if (!elements.length) {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -10% 0px'
    }
  );

  elements.forEach((element) => observer.observe(element));
}

function initFaqAccordion() {
  const faqList = document.querySelector('[data-faq-list]');
  if (!faqList) {
    return;
  }

  const triggers = Array.from(faqList.querySelectorAll('.faq-trigger'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const expandPanel = (panel) => {
    if (panel.hidden) {
      panel.hidden = false;
    }

    if (reducedMotion) {
      panel.style.removeProperty('height');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
      return;
    }

    panel.style.overflow = 'hidden';
    panel.style.height = '0px';
    panel.style.opacity = '0';
    panel.style.transition = 'height 260ms ease, opacity 220ms ease';

    panel.offsetHeight;

    panel.style.height = `${panel.scrollHeight}px`;
    panel.style.opacity = '1';

    const onExpandEnd = (event) => {
      if (event.propertyName !== 'height') {
        return;
      }

      panel.style.removeProperty('height');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
      panel.style.removeProperty('opacity');
    };

    panel.addEventListener('transitionend', onExpandEnd, { once: true });
  };

  const collapsePanel = (panel) => {
    if (panel.hidden) {
      return;
    }

    if (reducedMotion) {
      panel.hidden = true;
      panel.style.removeProperty('height');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
      return;
    }

    panel.style.overflow = 'hidden';
    panel.style.height = `${panel.scrollHeight}px`;
    panel.style.opacity = '1';
    panel.style.transition = 'height 220ms ease, opacity 180ms ease';

    panel.offsetHeight;

    panel.style.height = '0px';
    panel.style.opacity = '0';

    const onCollapseEnd = (event) => {
      if (event.propertyName !== 'height') {
        return;
      }

      panel.hidden = true;
      panel.style.removeProperty('height');
      panel.style.removeProperty('opacity');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('transition');
    };

    panel.addEventListener('transitionend', onCollapseEnd, { once: true });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const panelId = trigger.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) {
        return;
      }

      triggers.forEach((otherTrigger) => {
        if (otherTrigger === trigger) {
          return;
        }

        otherTrigger.setAttribute('aria-expanded', 'false');
        const otherPanelId = otherTrigger.getAttribute('aria-controls');
        const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;
        if (otherPanel) {
          collapsePanel(otherPanel);
        }
      });

      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        collapsePanel(panel);
        return;
      }

      trigger.setAttribute('aria-expanded', 'true');
      expandPanel(panel);
    });
  });
}
