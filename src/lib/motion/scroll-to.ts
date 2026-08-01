import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenisInstance } from "@/lib/motion/LenisProvider";

export function scrollToId(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;

  const lenis = getLenisInstance();
  if (lenis) {
    lenis.scrollTo(target);
    return;
  }

  target.scrollIntoView({ behavior: "auto" });
}

const PILLAR_ORDER = ["web", "graphics", "video"];

/**
 * Scrolls to a Pillars panel. When the Pillars section is horizontally
 * pinned (desktop, motion allowed), the panel's DOM position doesn't
 * reflect its visual position, so we map the panel's index to a scroll
 * offset within the pin's scrubbed range instead of scrolling to the
 * element directly.
 */
export function scrollToPillar(id: string): void {
  const trigger = ScrollTrigger.getById("pillars");
  if (!trigger) {
    scrollToId(id);
    return;
  }

  const index = PILLAR_ORDER.indexOf(id);
  if (index === -1) {
    scrollToId(id);
    return;
  }

  const progress = index / (PILLAR_ORDER.length - 1);
  const y = trigger.start + progress * (trigger.end - trigger.start);

  const lenis = getLenisInstance();
  if (lenis) {
    lenis.scrollTo(y);
    return;
  }

  window.scrollTo({ top: y });
}
