"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function CallToAction() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = section?.querySelector("[data-cta-content]");
    if (!section || !content) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(content, { opacity: 1, y: 0 });
      return;
    }

    const tween = gsap.fromTo(
      content,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-ink px-6 text-center"
    >
      <div data-cta-content className="flex flex-col items-center gap-6">
        <p className="max-w-xl text-3xl font-medium text-surface md:text-4xl">
          Let&apos;s build something worth remembering.
        </p>
        <a
          href="mailto:hello@cylentsolutions.com"
          className="rounded-full bg-accent px-8 py-3 text-sm font-medium uppercase tracking-widest text-surface transition-opacity hover:opacity-90"
        >
          Start a conversation
        </a>
      </div>
    </section>
  );
}
