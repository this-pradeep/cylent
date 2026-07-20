import { computeTilt } from './tilt-math';

export function initFeaturedWorkEffects(): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-work-card]');
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      }
    },
    { threshold: 0.25 }
  );

  cards.forEach((card) => {
    observer.observe(card);

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width;
      const relY = (event.clientY - rect.top) / rect.height;
      const { rotateX, rotateY } = computeTilt(relX, relY, 8);
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
    });
  });
}
