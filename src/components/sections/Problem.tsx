"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clampProgress } from "@/lib/motion/scroll-progress";

const PROBLEM_TILES = [
  { label: "Outdated websites", offset: { x: -60, y: -30, rotate: -6 } },
  { label: "Weak visual identity", offset: { x: 50, y: 20, rotate: 5 } },
  { label: "Forgettable presence", offset: { x: -40, y: 40, rotate: 4 } },
  { label: "Inconsistent experiences", offset: { x: 60, y: -20, rotate: -4 } },
];

export function Problem() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tiles = section.querySelectorAll<HTMLDivElement>("[data-tile]");

    if (prefersReducedMotion) {
      gsap.set(tiles, { x: 0, y: 0, rotate: 0, opacity: 1 });
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "center center",
      scrub: 1,
      onUpdate: (self) => {
        const progress = clampProgress(self.progress);
        tiles.forEach((tile, index) => {
          const { x, y, rotate } = PROBLEM_TILES[index].offset;
          gsap.set(tile, {
            x: x * (1 - progress),
            y: y * (1 - progress),
            rotate: rotate * (1 - progress),
            opacity: 0.3 + 0.7 * progress,
          });
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="flex min-h-screen flex-col items-center justify-center gap-10 bg-surface px-6 py-24">
      <p className="max-w-2xl text-center text-2xl font-medium text-ink md:text-3xl">
        Most businesses are held back by the same things.
      </p>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
        {PROBLEM_TILES.map((tile) => (
          <div
            key={tile.label}
            data-tile
            className="flex aspect-[4/3] items-center justify-center rounded-sm border border-ink/10 bg-ink/5 px-4 text-center text-sm font-medium text-ink-muted"
          >
            {tile.label}
          </div>
        ))}
      </div>
    </section>
  );
}
