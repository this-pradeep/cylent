"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { markLoaderReady } from "@/lib/motion/loader-ready";
import {
  LOADER_TRIAD,
  greetingForHour,
  wordsRevealed,
} from "@/lib/motion/loader-copy";

// Long enough for the triad to arrive one word at a time and be read. The loader
// now sets the pace rather than waiting on a timer — the visitor is watching a
// sequence that is actually happening, not sitting through an artificial delay.
const MIN_DURATION_MS = 2600;
const MAX_DURATION_MS = 4600;

export function Loader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const fillRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const progressRowRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(true);
  const [greeting, setGreeting] = useState("Hello.");
  const [clock, setClock] = useState("");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));

    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const city = zone.split("/").pop()?.replace(/_/g, " ") ?? "";
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    setClock(city ? `${time} · ${city}` : time);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const words = wordRefs.current.filter(
      (node): node is HTMLSpanElement => node !== null,
    );
    const greetingEl = greetingRef.current;
    const fill = fillRef.current;
    if (!greetingEl || !fill || words.length !== LOADER_TRIAD.length) return;

    const revealed = new Set<number>();
    const proxy = { value: 0 };
    let settled = false;
    let fontsReady = false;
    let minTimeElapsed = false;

    const revealWord = (index: number, instant: boolean) => {
      if (revealed.has(index)) return;
      revealed.add(index);
      const node = words[index];
      if (instant) {
        gsap.set(node, { yPercent: 0, opacity: 1 });
        return;
      }
      gsap.to(node, {
        yPercent: 0,
        opacity: 1,
        duration: 0.85,
        ease: "expo.out",
        overwrite: true,
      });
    };

    const applyProgress = (percent: number, instant = false) => {
      if (counterRef.current) {
        counterRef.current.textContent = String(Math.round(percent));
      }
      gsap.set(fill, {
        clipPath: `inset(0 ${100 - percent}% 0 0)`,
      });

      const count = wordsRevealed(percent);
      for (let i = 0; i < count; i++) revealWord(i, instant);
    };

    if (prefersReducedMotion) {
      gsap.set([metaRef.current, greetingEl, progressRowRef.current], {
        opacity: 1,
        yPercent: 0,
      });
      applyProgress(100, true);
      markLoaderReady();
      const timer = setTimeout(() => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.25,
          onComplete: () => setVisible(false),
        });
      }, 600);
      return () => clearTimeout(timer);
    }

    // Pre-entrance state, set immediately so nothing flashes in its final position.
    gsap.set(metaRef.current, { opacity: 0 });
    gsap.set(greetingEl, { yPercent: 110 });
    gsap.set(words, { yPercent: 115, opacity: 0 });
    gsap.set(progressRowRef.current, { opacity: 0 });
    gsap.set(fill, { clipPath: "inset(0 100% 0 0)" });

    const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    intro
      .to(metaRef.current, { opacity: 1, duration: 0.7 }, 0.1)
      .to(greetingEl, { yPercent: 0, duration: 1.05 }, 0.15)
      .to(progressRowRef.current, { opacity: 1, duration: 0.6 }, 0.7);

    applyProgress(0);

    const progressTween = gsap.to(proxy, {
      value: 92,
      duration: (MAX_DURATION_MS / 1000) * 0.82,
      ease: "power1.out",
      onUpdate: () => applyProgress(proxy.value),
    });

    let exitTl: gsap.core.Timeline | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      progressTween.kill();

      exitTl = gsap.timeline();
      exitTl.to(proxy, {
        value: 100,
        duration: 0.4,
        ease: "power2.out",
        onUpdate: () => applyProgress(proxy.value),
      });

      // The greeting and the triad mask upward out of their clips while the hero's
      // own lines mask upward in — one continuous handover rather than a screen
      // fading away to reveal another screen underneath.
      exitTl
        .to(
          [greetingEl, ...words],
          { yPercent: -115, duration: 0.8, ease: "power3.inOut", stagger: 0.06 },
          "+=0.25",
        )
        .to(
          [metaRef.current, progressRowRef.current],
          { opacity: 0, duration: 0.45, ease: "power2.out" },
          "<0.1",
        )
        .add(markLoaderReady, "<0.25")
        .to(
          containerRef.current,
          {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => setVisible(false),
          },
          "<0.15",
        );
    };

    const checkDone = () => {
      if (fontsReady && minTimeElapsed) finish();
    };

    void document.fonts.ready.then(() => {
      fontsReady = true;
      checkDone();
    });

    const minTimer = setTimeout(() => {
      minTimeElapsed = true;
      checkDone();
    }, MIN_DURATION_MS);
    const maxTimer = setTimeout(finish, MAX_DURATION_MS);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      progressTween.kill();
      intro.kill();
      exitTl?.kill();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-9998 flex flex-col justify-end bg-surface px-6 pb-10 md:px-[6vw] md:pb-[5.5vh]"
    >
      {/* One static announcement. The counter is aria-hidden below — an aria-live
          region containing a value that changes every frame would flood a screen
          reader with percentages. */}
      <span className="sr-only">Loading Cylent Solutions</span>

      <div aria-hidden="true">
        <div
          ref={metaRef}
          className="absolute inset-x-6 top-8 flex justify-between text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-muted md:inset-x-[6vw] md:top-10"
        >
          <span>Cylent Solutions</span>
          <span className="tabular-nums">{clock}</span>
        </div>

        <span className="block overflow-hidden pb-[0.12em]">
          <span
            ref={greetingRef}
            className="block text-[clamp(2rem,5.2vw,4.75rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink"
          >
            {greeting}
          </span>
        </span>

        <span className="mt-[0.7em] flex flex-wrap items-baseline gap-x-[0.5em]">
          {LOADER_TRIAD.map((word, index) => (
            <span key={word} className="block overflow-hidden pb-[0.14em]">
              <span
                ref={(node) => {
                  wordRefs.current[index] = node;
                }}
                className="block text-[clamp(1.05rem,2.2vw,1.9rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink-muted"
              >
                {word}
              </span>
            </span>
          ))}
        </span>

        <div ref={progressRowRef} className="mt-[2.4rem]">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-muted">
              Loading
            </span>
            <span className="font-semibold leading-none tracking-[-0.03em] text-ink">
              <span
                ref={counterRef}
                className="text-[clamp(1.75rem,3.6vw,3.25rem)] tabular-nums"
              >
                0
              </span>
              <span className="ml-[0.06em] text-[clamp(0.85rem,1.7vw,1.5rem)] text-ink-muted">
                %
              </span>
            </span>
          </div>

          {/* The fill is a full-width chromatic bar revealed by an inset clip rather
              than a scaled one: scaleX would compress the gradient, so at 10% you'd
              see the whole spectrum squeezed into a sliver. Clipping keeps the colour
              ramp true at every value, and neither property triggers layout. */}
          <span className="mt-3 block h-[2px] w-full overflow-hidden rounded-full bg-ink/10">
            <span
              ref={fillRef}
              className="block h-full w-full rounded-full bg-[linear-gradient(90deg,#ff5ca8,#ffc76e,#8cffd6,#4ed6e8,#8b7bff,#ff8cf0)]"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
