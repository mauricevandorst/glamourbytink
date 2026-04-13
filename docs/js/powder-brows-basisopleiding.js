document.addEventListener('DOMContentLoaded', () => {
  initCursorGlow();
});

function initCursorGlow() {
  const cursor = document.querySelector('.cursor-glow');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!cursor || reducedMotion || coarsePointer) {
    return;
  }

  const particleLimit = 18;
  const particleSpawnInterval = 36;
  const activeParticles = new Set();

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;
  let previousX = currentX;
  let previousY = currentY;
  let frameId = null;
  let lastParticleTime = 0;

  const spawnParticle = (x, y, velocityX, velocityY) => {
    const particle = document.createElement('span');
    const size = 6 + Math.random() * 4.5;
    const driftX = (Math.random() - 0.5) * 16 - velocityX * 0.06;
    const driftY = -10 - Math.random() * 14 - Math.min(8, Math.abs(velocityY) * 0.05);

    particle.className = 'cursor-trail-particle cursor-trail-particle--spark';
    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);
    particle.style.setProperty('--drift-x', `${driftX.toFixed(2)}px`);
    particle.style.setProperty('--drift-y', `${driftY.toFixed(2)}px`);
    particle.style.setProperty('--particle-size', `${size.toFixed(2)}px`);
    particle.style.setProperty('--particle-duration', `${(760 + Math.random() * 420).toFixed(0)}ms`);
    particle.style.setProperty('--twinkle-rotate', `${(Math.random() * 70 - 35).toFixed(2)}deg`);

    document.body.appendChild(particle);
    activeParticles.add(particle);

    particle.addEventListener(
      'animationend',
      () => {
        activeParticles.delete(particle);
        particle.remove();
      },
      { once: true }
    );

    if (activeParticles.size > particleLimit) {
      const oldestParticle = activeParticles.values().next().value;
      if (oldestParticle) {
        activeParticles.delete(oldestParticle);
        oldestParticle.remove();
      }
    }
  };

  const render = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;

    const deltaX = currentX - previousX;
    const deltaY = currentY - previousY;
    const distance = Math.hypot(targetX - currentX, targetY - currentY);
    const rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    cursor.style.opacity = '1';
    cursor.style.setProperty('--cursor-rotation', `${rotation.toFixed(2)}deg`);
    cursor.style.setProperty('--cursor-scale', `${(1 + Math.min(0.05, distance / 520)).toFixed(3)}`);
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate3d(-50%, -50%, 0) scale(var(--cursor-scale))`;

    previousX = currentX;
    previousY = currentY;

    if (distance > 0.18) {
      frameId = requestAnimationFrame(render);
      return;
    }

    frameId = null;
  };

  window.addEventListener('pointermove', (event) => {
    const velocityX = event.clientX - targetX;
    const velocityY = event.clientY - targetY;
    const movement = Math.abs(velocityX) + Math.abs(velocityY);
    const now = performance.now();

    targetX = event.clientX;
    targetY = event.clientY;

    if (movement > 2.5 && now - lastParticleTime >= particleSpawnInterval) {
      spawnParticle(event.clientX - velocityX * 0.18, event.clientY - velocityY * 0.18, velocityX, velocityY);

      if (movement > 26) {
        spawnParticle(
          event.clientX + (Math.random() - 0.5) * 5,
          event.clientY + (Math.random() - 0.5) * 5,
          velocityX * 0.6,
          velocityY * 0.6
        );
      }

      lastParticleTime = now;
    }

    if (!frameId) {
      frameId = requestAnimationFrame(render);
    }
  });

  window.addEventListener('pointerleave', () => {
    cursor.style.opacity = '0';
    cursor.style.setProperty('--cursor-scale', '1');
  });
}
