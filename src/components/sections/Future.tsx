"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function Future() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const copy = section?.querySelector("[data-future-copy]");
    if (!section || !copy) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(copy, { opacity: 1, scale: 1 });
      return;
    }

    const tween = gsap.fromTo(
      copy,
      { opacity: 0, scale: 1.05 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
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
    <section ref={sectionRef} className="flex min-h-[70vh] flex-col items-center justify-center bg-surface px-6 text-center">
      <p data-future-copy className="max-w-2xl text-3xl font-medium text-ink md:text-4xl">
        What could we create for your brand?
      </p>
    </section>
  );
}
