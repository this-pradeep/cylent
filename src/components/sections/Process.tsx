"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldPinSection } from "@/lib/motion/breakpoint";
import { mapScrollToStep } from "@/lib/motion/scroll-progress";

const PROCESS_STEPS = ["Discover", "Plan", "Create", "Refine", "Launch"];

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pin = shouldPinSection(window.innerWidth, prefersReducedMotion);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=150%",
      pin,
      scrub: 1,
      onUpdate: (self) => {
        setActiveStep(mapScrollToStep(self.progress, PROCESS_STEPS.length));
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-screen flex-col items-center justify-center gap-12 bg-surface px-6">
      <p className="text-2xl font-medium text-ink md:text-3xl">How we work.</p>
      <ol className="flex w-full max-w-3xl flex-col gap-4 md:flex-row md:justify-between">
        {PROCESS_STEPS.map((step, index) => (
          <li
            key={step}
            data-step={index}
            className={`text-lg font-medium transition-colors duration-300 md:text-xl ${
              index <= activeStep ? "text-ink" : "text-ink-muted/40"
            }`}
          >
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
