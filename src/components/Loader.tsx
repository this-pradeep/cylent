"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { WebIcon } from "@/components/icons/ServiceIcons";
import { markLoaderReady } from "@/lib/motion/loader-ready";

const MIN_DURATION_MS = 1600;
const MAX_DURATION_MS = 4200;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerpRgba(from: [number, number, number, number], to: [number, number, number, number], t: number): string {
  const r = from[0] + (to[0] - from[0]) * t;
  const g = from[1] + (to[1] - from[1]) * t;
  const b = from[2] + (to[2] - from[2]) * t;
  const a = from[3] + (to[3] - from[3]) * t;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const WIRE_BORDER: [number, number, number, number] = [20, 18, 15, 0.25];
const WIRE_FILL: [number, number, number, number] = [20, 18, 15, 0.05];
const CLEAR: [number, number, number, number] = [20, 18, 15, 0];
const PILL_FILL: [number, number, number, number] = [20, 18, 15, 0.05];

export function Loader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameGroupRef = useRef<HTMLDivElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const line1Ref = useRef<HTMLSpanElement>(null);
  const line1TextRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const pillTextRef = useRef<HTMLSpanElement>(null);
  const line3Ref = useRef<HTMLSpanElement>(null);
  const line3TextRef = useRef<HTMLSpanElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const subtextTextRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTextRef = useRef<HTMLSpanElement>(null);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const proxy = { value: 0 };
    let settled = false;
    let fontsReady = false;
    let minTimeElapsed = false;

    const applyProgress = (percent: number) => {
      if (counterRef.current) counterRef.current.textContent = `${Math.round(percent)}%`;

      const p = percent / 100;
      const colorProgress = smoothstep(0.28, 0.72, p);
      const structFade = smoothstep(0.7, 0.97, p);

      [line1TextRef, pillTextRef, line3TextRef, subtextTextRef, scrollTextRef].forEach((ref) => {
        if (ref.current) ref.current.style.opacity = String(colorProgress);
      });

      [line1Ref, line3Ref, subtextRef, scrollRef].forEach((ref) => {
        if (!ref.current) return;
        ref.current.style.borderColor = lerpRgba(WIRE_BORDER, CLEAR, colorProgress);
        ref.current.style.backgroundColor = lerpRgba(WIRE_FILL, CLEAR, colorProgress);
      });

      if (pillRef.current) {
        pillRef.current.style.borderColor = lerpRgba(WIRE_BORDER, CLEAR, colorProgress);
        pillRef.current.style.backgroundColor = lerpRgba(WIRE_FILL, PILL_FILL, colorProgress);
        pillRef.current.style.setProperty("--ring-opacity", String(colorProgress));
      }

      [frameGroupRef, navBarRef, counterRef].forEach((ref) => {
        if (ref.current) ref.current.style.opacity = String(1 - structFade);
      });
    };

    applyProgress(0);

    const progressTween = gsap.to(proxy, {
      value: 92,
      duration: (MAX_DURATION_MS / 1000) * 0.85,
      ease: "power1.out",
      onUpdate: () => applyProgress(proxy.value),
    });

    const finish = () => {
      if (settled) return;
      settled = true;
      progressTween.kill();

      const tl = gsap.timeline();
      tl.to(proxy, {
        value: 100,
        duration: 0.35,
        ease: "power2.out",
        onUpdate: () => applyProgress(proxy.value),
      });

      markLoaderReady();

      tl.to(
        containerRef.current,
        {
          opacity: 0,
          duration: prefersReducedMotion ? 0.2 : 0.7,
          ease: "power2.out",
          onComplete: () => setVisible(false),
        },
        prefersReducedMotion ? 0 : "+=0.15"
      );
    };

    const checkDone = () => {
      if (fontsReady && minTimeElapsed) finish();
    };

    document.fonts.ready.then(() => {
      fontsReady = true;
      checkDone();
    });

    const minTimer = setTimeout(() => {
      minTimeElapsed = true;
      checkDone();
    }, MIN_DURATION_MS);

    const maxTimer = setTimeout(finish, MAX_DURATION_MS);

    if (prefersReducedMotion) {
      applyProgress(100);
    }

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      progressTween.kill();
    };
  }, []);

  if (!visible) return null;

  return (
    <div ref={containerRef} role="status" aria-live="polite" aria-label="Loading" className="fixed inset-0 z-9998 bg-surface">
      <div ref={frameGroupRef} className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-6 rounded-3xl border md:inset-10"
          style={{ borderColor: "rgba(20, 18, 15, 0.2)" }}
        />
        <div
          className="absolute left-6 top-6 h-7 w-7 border-l-2 border-t-2 md:left-10 md:top-10"
          style={{ borderColor: "rgba(20, 18, 15, 0.35)" }}
        />
        <div
          className="absolute right-6 top-6 h-7 w-7 border-r-2 border-t-2 md:right-10 md:top-10"
          style={{ borderColor: "rgba(20, 18, 15, 0.35)" }}
        />
        <div
          className="absolute bottom-6 left-6 h-7 w-7 border-b-2 border-l-2 md:bottom-10 md:left-10"
          style={{ borderColor: "rgba(20, 18, 15, 0.35)" }}
        />
        <div
          className="absolute bottom-6 right-6 h-7 w-7 border-b-2 border-r-2 md:bottom-10 md:right-10"
          style={{ borderColor: "rgba(20, 18, 15, 0.35)" }}
        />
      </div>

      <div
        ref={navBarRef}
        className="absolute inset-x-0 top-4 mx-auto h-14 w-full max-w-3xl rounded-full border md:top-6"
        style={{ borderColor: "rgba(20, 18, 15, 0.25)" }}
      />

      <div className="flex h-full flex-col items-center justify-center bg-surface px-6 text-center">
        <h1 className="flex max-w-4xl flex-col items-center gap-2 text-5xl font-semibold tracking-tight text-ink md:max-w-none md:gap-3 md:text-7xl">
          <span className="inline-flex flex-wrap items-center justify-center gap-4">
            <span
              ref={line1Ref}
              className="rounded-md border px-3 py-1"
              style={{ borderColor: "rgba(20, 18, 15, 0.25)", backgroundColor: "rgba(20, 18, 15, 0.05)" }}
            >
              <span ref={line1TextRef} className="opacity-0">
                We build
              </span>
            </span>

            <span
              ref={pillRef}
              className="chromatic-ring inline-flex items-center gap-3 overflow-hidden rounded-full border px-6 py-3 text-4xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_24px_rgba(20,18,15,0.1)] md:px-8 md:py-4 md:text-6xl"
              style={{
                borderColor: "rgba(20, 18, 15, 0.25)",
                backgroundColor: "rgba(20, 18, 15, 0.05)",
                ["--ring-opacity" as string]: 0,
              }}
            >
              <span ref={pillTextRef} className="inline-flex items-center gap-3 whitespace-nowrap opacity-0">
                <WebIcon className="h-[0.7em] w-[0.7em] shrink-0" />
                <span>Web</span>
              </span>
            </span>
          </span>

          <span
            ref={line3Ref}
            className="rounded-md border px-3 py-1 md:whitespace-nowrap"
            style={{ borderColor: "rgba(20, 18, 15, 0.25)", backgroundColor: "rgba(20, 18, 15, 0.05)" }}
          >
            <span ref={line3TextRef} className="opacity-0">
              experiences worth remembering.
            </span>
          </span>
        </h1>

        <p
          ref={subtextRef}
          className="mt-6 max-w-xl rounded-md border px-3 py-1 text-lg text-ink-muted"
          style={{ borderColor: "rgba(20, 18, 15, 0.2)", backgroundColor: "rgba(20, 18, 15, 0.05)" }}
        >
          <span ref={subtextTextRef} className="opacity-0">
            Cylent Solutions merges technology, visuals, and storytelling into one creative process.
          </span>
        </p>

        <div
          ref={scrollRef}
          className="absolute bottom-10 rounded-md border px-2 py-1 text-sm uppercase tracking-widest text-ink-muted"
          style={{ borderColor: "rgba(20, 18, 15, 0.2)", backgroundColor: "rgba(20, 18, 15, 0.05)" }}
        >
          <span ref={scrollTextRef} className="opacity-0">
            Scroll
          </span>
        </div>
      </div>

      <span
        ref={counterRef}
        className="absolute bottom-6 right-6 text-sm uppercase tracking-widest tabular-nums text-ink-muted md:bottom-10 md:right-10"
      >
        0%
      </span>
    </div>
  );
}
