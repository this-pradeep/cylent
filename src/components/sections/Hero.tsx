"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import {
  WebIcon,
  VideoIcon,
  GraphicsIcon,
} from "@/components/icons/ServiceIcons";
import { HeroCreativeSlot } from "@/components/sections/hero/HeroCreativeSlot";
import {
  REDUCED_MOTION_FADE_S,
  ROTATE_INTERVAL_MS,
  SLIDE_DURATION_S,
} from "@/lib/motion/rotator-timing";
import { onLoaderReady } from "@/lib/motion/loader-ready";

const ROTATOR_ITEMS = [
  { label: "Websites", Icon: WebIcon },
  { label: "Videos", Icon: VideoIcon },
  { label: "Designs", Icon: GraphicsIcon },
];

// The rotating word lives inside the h1, so the heading's accessible name would
// otherwise change on every cycle and be re-announced. The visual headline is
// aria-hidden; this is the stable name assistive tech reads instead.
const HEADLINE_LABEL =
  "Websites, videos and designs worth remembering. Three disciplines. One studio. No hand-offs.";

const ETHOS = ["Imagine", "Build", "Inspire"];

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const isFirstRender = useRef(true);
  const reducedMotionRef = useRef(false);

  // The interval keeps its cadence while paused and simply declines to advance, so
  // resuming doesn't hand the visitor a truncated first hold.
  const setPausedBoth = useCallback((next: boolean) => {
    pausedRef.current = next;
    setPaused(next);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    reducedMotionRef.current = prefersReducedMotion;

    const root = containerRef.current;
    if (!root) return;

    const lines = root.querySelectorAll<HTMLSpanElement>(
      "[data-hero-line] > span",
    );
    const creative = root.querySelector("[data-hero-creative]");
    const deck = root.querySelector("[data-hero-deck]");
    const support = root.querySelector("[data-hero-support]");
    const rail = root.querySelector("[data-hero-rail]");
    if (!lines.length || !creative || !deck || !support || !rail) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let tl: gsap.core.Timeline | undefined;

    const startRotation = () => {
      if (cancelled) return;
      intervalId = setInterval(() => {
        if (pausedRef.current) return;
        const pill = pillRef.current;
        if (pill && !reducedMotionRef.current) {
          // Lock the pill to its current rendered width before the content swaps,
          // so we have a stable "from" value for the resize animation below.
          gsap.set(pill, { width: pill.getBoundingClientRect().width });
        }
        setIndex((current) => (current + 1) % ROTATOR_ITEMS.length);
      }, ROTATE_INTERVAL_MS);
    };

    // next/font defaults to font-display: swap, so a fallback face paints first. The
    // pill measures its rendered width to compute the tween target — measuring before
    // the swap lands animates to a stale value and the pill visibly resettles.
    const startWhenFontsReady = () => {
      const fonts = document.fonts;
      if (!fonts) {
        startRotation();
        return;
      }
      void fonts.ready.then(startRotation);
    };

    if (prefersReducedMotion) {
      gsap.set(lines, { yPercent: 0 });
      gsap.set([creative, deck, support, rail], { opacity: 1, y: 0 });
      startWhenFontsReady();
      return () => {
        cancelled = true;
        if (intervalId) clearInterval(intervalId);
      };
    }

    // Set the pre-entrance state immediately rather than inside the loader callback,
    // so the hero is never briefly visible in its final state before revealing.
    gsap.set(lines, { yPercent: 110, willChange: "transform" });
    gsap.set(creative, { opacity: 0, scale: 0.94 });
    gsap.set([deck, support], { opacity: 0, y: 16 });
    gsap.set(rail, { opacity: 0 });

    // Hold the entrance until the loader signals it's done (motion-system.md:
    // "1. Preloader exits, 2. Headline reveal" is a sequence, not two independent starts).
    const unsubscribe = onLoaderReady(() => {
      if (cancelled) return;

      tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          gsap.set(lines, { clearProps: "willChange" });
          startWhenFontsReady();
        },
      });

      tl.to(lines, { yPercent: 0, duration: 1.05, stagger: 0.14 }, 0)
        .to(creative, { opacity: 1, scale: 1, duration: 1.2 }, 0.3)
        .to(deck, { opacity: 1, y: 0, duration: 0.7 }, 0.85)
        .to(support, { opacity: 1, y: 0, duration: 0.7 }, 1.0)
        .to(rail, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.45);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      tl?.kill();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const pill = pillRef.current;
    const content = contentRef.current;
    if (!pill || !content) return;

    // Reduced motion: the rotation still runs — a word swap is a content change, not
    // movement — but nothing translates or resizes. Opacity is not a vestibular trigger.
    if (reducedMotionRef.current) {
      gsap.set(pill, { width: "auto" });
      gsap.fromTo(
        content,
        { opacity: 0 },
        {
          opacity: 1,
          duration: REDUCED_MOTION_FADE_S,
          ease: "power2.out",
          overwrite: true,
        },
      );
      return;
    }

    const lockedWidth = pill.style.width;

    // Briefly release the width lock to measure how wide the new content wants to be,
    // then restore the old width instantly (no visible jump) before animating to it.
    gsap.set(pill, { width: "auto" });
    const targetWidth = pill.getBoundingClientRect().width;
    gsap.set(pill, { width: lockedWidth || targetWidth });

    gsap.to(pill, {
      width: targetWidth,
      duration: SLIDE_DURATION_S,
      ease: "power3.out",
      overwrite: true,
    });
    gsap.fromTo(
      content,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: SLIDE_DURATION_S,
        ease: "power3.out",
        overwrite: true,
      },
    );
  }, [index]);

  const { label, Icon } = ROTATOR_ITEMS[index];

  return (
    <section
      ref={containerRef}
      className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden bg-surface pb-[4vh] md:pb-[5.5vh]"
    >
      {/* Cropped by the top edge; the headline's cap-height crosses its lower edge. */}
      <HeroCreativeSlot
        index={index}
        className="left-1/2 top-[-6vh] aspect-square w-[130vw] -translate-x-1/2 md:left-[52%] md:top-[-14vh] md:w-[60vw]"
      />

      <div className="relative z-10 mb-[6vh] px-6 md:mb-[7vh] md:px-[6vw]">
        <div className="md:flex md:items-end md:justify-between md:gap-[6vw]">
          <div className="md:w-[56%]">
            <h1
              aria-label={HEADLINE_LABEL}
              className="text-[clamp(2.25rem,6vw,6rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink"
            >
              <span aria-hidden="true">
                {/* Line breaks are authored, not wrapped: each masked line needs its own
                    clipping wrapper. The first wrapper may wrap internally on narrow
                    viewports and reveals as a single unit — the clip travels with it. */}
                {/* Line 1's clip box is padded generously: the glass pill is taller than
                    the line box and casts a 24px blur, both of which overflow-hidden
                    would otherwise crop. Negative margins cancel the padding's effect
                    on layout, leaving only the extra clip room. */}
                <span
                  data-hero-line
                  className="mt-[-0.3em] mb-[-0.5em] block overflow-hidden pt-[0.3em] pb-[0.5em]"
                >
                  <span className="block">
                    <span
                      ref={pillRef}
                      onMouseEnter={() => setPausedBoth(true)}
                      onMouseLeave={() => setPausedBoth(false)}
                      className="chromatic-ring inline-flex items-center gap-[0.3em] overflow-hidden rounded-full bg-ink/5 px-[0.6em] py-[0.26em] align-baseline shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_24px_rgba(20,18,15,0.1)]"
                    >
                      <span
                        ref={contentRef}
                        className="inline-flex items-center gap-[0.3em] whitespace-nowrap"
                      >
                        <Icon className="h-[0.62em] w-[0.62em] shrink-0" />
                        <span>{label}</span>
                      </span>
                    </span>
                  </span>
                </span>
                <span
                  data-hero-line
                  className="mb-[-0.14em] block  pb-[0.14em]"
                >
                  <span className="block whitespace-nowrap">
                    Worth Remembering.
                  </span>
                </span>
              </span>
            </h1>

            <p
              data-hero-deck
              className="mt-[0.6em] text-[clamp(1.0625rem,2.1vw,1.75rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink"
            >
              Three disciplines. One studio. Great experience.
            </p>
          </div>

          <p
            data-hero-support
            className="mt-5 text-[clamp(0.8125rem,1.15vw,1rem)] leading-[1.6] tracking-[-0.005em] text-ink-muted md:mt-0 md:w-[24%] md:max-w-[28ch] md:text-right"
          >
            Cylent Solutions merges technology, visuals, and storytelling into
            one creative process.
          </p>
        </div>

        {/* Keyboard route to WCAG 2.2.2. It cannot live on the pill, which sits inside
            the aria-hidden subtree — a focusable node in there is its own violation. */}
        <button
          type="button"
          onClick={() => setPausedBoth(!paused)}
          className="sr-only focus-visible:not-sr-only focus-visible:mt-4 focus-visible:inline-block focus-visible:rounded-full focus-visible:bg-ink focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-surface"
        >
          {paused ? "Resume" : "Pause"} discipline rotation
        </button>
      </div>

      <div
        data-hero-rail
        className="relative z-10 flex items-center justify-between px-6 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-ink-muted md:px-[6vw]"
      >
        <div className="flex items-center gap-[0.9em]">
          {ETHOS.map((word, i) => (
            <span key={word} className="flex items-center gap-[0.9em]">
              {i > 0 && <span className="text-ink/25">/</span>}
              {word}
            </span>
          ))}
        </div>
        <div className="hidden md:block">Scroll ↓</div>
      </div>
    </section>
  );
}
