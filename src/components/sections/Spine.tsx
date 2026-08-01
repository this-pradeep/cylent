"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LightChainCanvas } from "@/components/light/LightChainCanvas";

const MOVEMENTS = [
  {
    word: "Imagine.",
    body: "Every project starts with an argument, not a mood board. What is this for? Who has to feel something? What happens if we do nothing at all? We don't open a design tool until those have answers.",
  },
  {
    word: "Build.",
    body: "Then we make it. Code written from a blank file. Frames shot with intent. Brands built as systems. The people who imagined it are the people who build it — nothing survives a hand-off intact, so we removed the hand-off.",
  },
  {
    word: "Inspire.",
    body: "Then we leave. What's left has to work without us in the room — on a Tuesday, on a bad connection, on someone else's phone.",
  },
];

export function Spine() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const blocks = section.querySelectorAll<HTMLElement>("[data-movement]");
    if (!blocks.length) return;

    if (prefersReducedMotion) {
      gsap.set(blocks, { opacity: 1, y: 0 });
      return;
    }

    // No pin: Pillars already pins a horizontal track, and two sections that stop
    // the page to perform reads as a tic rather than as rhythm.
    const tweens = Array.from(blocks).map((block) =>
      gsap.fromTo(
        block,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: {
            trigger: block,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        },
      ),
    );

    return () => {
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative isolate overflow-hidden bg-surface"
    >
      {/* Spans the whole section rather than sticking: the beam runs the full height,
          so scrolling travels along the light instead of watching it in a frame. */}
      <LightChainCanvas className="pointer-events-none absolute inset-0 -z-10" />

      <div className="px-6 py-[16vh] md:px-[6vw]">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.24em] text-ink-muted">
          Section 02 — The spine
        </p>
        <h2 className="mt-5 max-w-[16ch] text-[clamp(2.25rem,5.6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
          Imagine. Build. Inspire.
        </h2>

        <div className="mt-[14vh] flex flex-col gap-[22vh]">
          {MOVEMENTS.map((movement) => (
            <div key={movement.word} data-movement className="max-w-[46ch]">
              <h3 className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-none tracking-[-0.035em] text-ink">
                {movement.word}
              </h3>
              <p className="mt-5 text-[clamp(0.9rem,1.15vw,1.0625rem)] leading-[1.78] tracking-[-0.004em] text-ink-muted">
                {movement.body}
              </p>
            </div>
          ))}
        </div>

        <p
          data-movement
          className="mt-[20vh] max-w-[24ch] text-[clamp(1.25rem,2.4vw,2rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-ink"
        >
          Imagine and Build are ours.{" "}
          <span className="text-ink-muted">Inspire is yours.</span>
        </p>
      </div>
    </section>
  );
}
