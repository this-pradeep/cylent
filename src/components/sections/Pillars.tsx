"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldPinSection } from "@/lib/motion/breakpoint";
import { BuildPanel } from "./pillars/BuildPanel";
import { CapturePanel } from "./pillars/CapturePanel";
import { MovePanel } from "./pillars/MovePanel";

export function Pillars() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pin = shouldPinSection(window.innerWidth, prefersReducedMotion);

    if (!pin) {
      gsap.set(track, { x: 0 });
      section.classList.add("h-auto", "flex-col");
      track.classList.remove("flex-row");
      track.classList.add("w-full", "flex-col");
      return;
    }

    const distance = track.scrollWidth - section.clientWidth;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${distance}`,
      pin: true,
      scrub: 1,
      animation: gsap.to(track, { x: -distance, ease: "none" }),
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-ink">
      <div ref={trackRef} className="flex h-full w-[300vw] flex-row">
        <BuildPanel />
        <CapturePanel />
        <MovePanel />
      </div>
    </section>
  );
}
