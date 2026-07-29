import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { activeStepIndex } from './process-progress-math';

gsap.registerPlugin(ScrollTrigger);

export function initProcessTimeline(): void {
  const section = document.querySelector<HTMLElement>('[data-process]');
  const line = section?.querySelector<HTMLElement>('[data-process-line]');
  const steps = section?.querySelectorAll<HTMLElement>('[data-process-step]');
  if (!section || !line || !steps?.length) return;

  ScrollTrigger.create({
    trigger: section,
    start: 'top center',
    end: 'bottom center',
    scrub: true,
    onUpdate: (self) => {
      line.style.transform = `scaleX(${self.progress})`;
      const active = activeStepIndex(self.progress, steps.length);
      steps.forEach((step, i) => {
        step.classList.toggle('is-active', i <= active);
      });
    },
  });
}
