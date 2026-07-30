"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function AttentionToDetail() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stat = section?.querySelector("[data-detail-stat]");
    if (!section || !stat) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(stat, { scale: 1, opacity: 1 });
      return;
    }

    const tween = gsap.fromTo(
      stat,
      { scale: 0.85, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <p data-detail-stat className="text-6xl font-semibold text-ink md:text-8xl">
        90+
      </p>
      <p className="max-w-md text-lg text-ink-muted">
        Every site we ship targets a Lighthouse performance score above 90 — craftsmanship you can measure, not just see.
      </p>
    </section>
  );
}
