"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const techLayer = section.querySelector("[data-layer-tech]");
    const visualLayer = section.querySelector("[data-layer-visual]");
    const copy = section.querySelector("[data-philosophy-copy]");
    if (!techLayer || !visualLayer || !copy) return;

    if (prefersReducedMotion) {
      gsap.set([techLayer, visualLayer, copy], { x: 0, opacity: 1 });
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 1 },
      scrollTrigger: {
        trigger: section,
        start: "top center",
        toggleActions: "play none none reverse",
      },
    });

    tl.fromTo(techLayer, { x: -80, opacity: 0 }, { x: 0, opacity: 1 })
      .fromTo(visualLayer, { x: 80, opacity: 0 }, { x: 0, opacity: 1 }, "<")
      .fromTo(copy, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, "-=0.4");

    return () => {
      ScrollTrigger.getAll().forEach((instance) => {
        if (instance.trigger === section) instance.kill();
      });
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-6 py-24"
    >
      <div className="relative flex w-full max-w-3xl items-center justify-center">
        <div
          data-layer-tech
          className="absolute h-40 w-40 rounded-sm border border-ink/10 bg-ink/5 md:h-56 md:w-56"
          style={{ left: "10%" }}
        />
        <div
          data-layer-visual
          className="absolute h-40 w-40 rounded-full bg-accent/20 md:h-56 md:w-56"
          style={{ right: "10%" }}
        />
        <p
          data-philosophy-copy
          className="relative z-10 max-w-lg text-center text-2xl font-medium text-ink md:text-3xl"
        >
          Technology creates functionality. Visuals create emotion. Together they create impact.
        </p>
      </div>
    </section>
  );
}
