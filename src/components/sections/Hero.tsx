"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const HEADLINE_WORDS = ["We", "build", "experiences", "worth", "remembering."];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const words = containerRef.current?.querySelectorAll<HTMLSpanElement>("[data-word]");
    const support = containerRef.current?.querySelector("[data-hero-support]");
    const cue = containerRef.current?.querySelector("[data-hero-scroll-cue]");
    if (!words || words.length === 0 || !support || !cue) return;

    if (prefersReducedMotion) {
      gsap.set([...words, support, cue], { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(words, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 })
      .fromTo(support, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.3")
      .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.2");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center"
    >
      <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-ink md:text-7xl">
        {HEADLINE_WORDS.map((word, index) => (
          <span key={`${word}-${index}`} data-word className="inline-block pr-3">
            {word}
          </span>
        ))}
      </h1>
      <p data-hero-support className="mt-6 max-w-xl text-lg text-ink-muted">
        Cylent Solutions merges technology, visuals, and storytelling into one creative process.
      </p>
      <div
        data-hero-scroll-cue
        className="absolute bottom-10 text-sm uppercase tracking-widest text-ink-muted"
      >
        Scroll
      </div>
    </section>
  );
}
