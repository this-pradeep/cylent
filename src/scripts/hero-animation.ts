import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './reduced-motion';

gsap.registerPlugin(ScrollTrigger);

export function initHeroAnimation(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;

  const words = hero.querySelectorAll<HTMLElement>('[data-hero-word]');
  const bg = hero.querySelector<HTMLElement>('[data-hero-bg]');
  const accentShape = hero.querySelector<HTMLElement>('[data-hero-accent]');

  if (prefersReducedMotion()) {
    gsap.set(words, { opacity: 1, y: 0, filter: 'blur(0px)' });
    return;
  }

  gsap.set(words, { opacity: 0, y: 24, filter: 'blur(8px)' });
  gsap.to(words, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.8,
    stagger: 0.08,
    ease: 'power3.out',
    delay: 0.2,
  });

  if (bg) {
    gsap.to(bg, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  if (accentShape) {
    gsap.to(accentShape, {
      yPercent: -25,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}
