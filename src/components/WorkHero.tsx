"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { EYEBROW_LIFT_HEADROOM, SectionEyebrow } from "@/components/SectionEyebrow";
import { onLoaderReady } from "@/lib/motion/loader-ready";
import type { Discipline, DisciplineMeta } from "@/lib/site/projects";

/**
 * The hero of a discipline's index page.
 *
 * It replaces a header that was a second printing of the chapter masthead on the homepage —
 * the same eyebrow, the same word, the same claim, and no motion at all — so clicking
 * "View all projects" landed the visitor on the thing they had just left. The hierarchy is
 * deliberately unchanged from that chapter, because a visitor arriving here has just read
 * it and the page should agree with itself; what changes is that the word now stands in
 * light rather than on an empty page.
 *
 * ## The graphic
 *
 * One shaft enters from the left, strikes the discipline, and leaves as separated colour.
 * That is the brand's core message stated as optics rather than as a sentence — technology
 * and design are one input, and the disciplines are what comes out the other side — and it
 * is the studio's own material: `prism-optics.ts`, the cursor lens and the loader all trade
 * in exactly this dispersion.
 *
 * The word itself stays ink. It is the prism: a solid body the light passes through, which
 * is why the colour belongs on the far side of it and not in it. That also keeps the accent
 * where `brand-guidelines.md` puts it, since the fan is light rather than a fill.
 *
 * ## Why this shape
 *
 * The site runs one light system with a rule: no two chapters take the same shape. Chapter 3
 * owns spread-radial fields (`About.tsx`) and Chapter 8 owns the top-anchored cone
 * (`Future.tsx`), which says so in as many words. This is side-entering and banded, so the
 * three read as one material and never as the same picture.
 *
 * The fan is angled per discipline, which is the reason it is worth having:
 * `brand-guidelines.md` gives web precision, video movement and design visual impact, so web
 * disperses narrowly and slowly, video throws wide and quick, and design sits between them.
 */

/** Dispersion order, long wavelength first, from the chromatic family the cursor uses. */
const BANDS = ["232, 71, 155", "242, 160, 60", "140, 255, 214", "31, 191, 212", "104, 83, 212"] as const;

/** How wide the fan throws, and how it breathes once it is open. One line per discipline. */
const FAN: Record<Discipline, { spread: number; sway: number; period: number }> = {
  web: { spread: 0.52, sway: 1.4, period: 11 },
  video: { spread: 1, sway: 3.2, period: 7.5 },
  graphics: { spread: 0.82, sway: 2.2, period: 9 },
};

/**
 * Apex at the frame's centre, where the word sits; mouth at the right edge.
 *
 * Both states carry the same three points in the same units, so the fan opens out of the
 * apex rather than a finished shape being scaled into place.
 */
function bandShape(index: number, spread: number, open: boolean): string {
  const half = open ? 36 * spread : 1.2;
  const step = (half * 2) / BANDS.length;
  const top = 50 - half + index * step;
  return `polygon(50% 50%, 100% ${top.toFixed(2)}%, 100% ${(top + step).toFixed(2)}%)`;
}

function bandFill(rgb: string): string {
  return (
    `linear-gradient(to right, rgba(${rgb}, 0) 50%, rgba(${rgb}, 0.26) 63%,` +
    ` rgba(${rgb}, 0.12) 82%, rgba(${rgb}, 0) 100%)`
  );
}

/** The shaft on its way in. Warm, because nothing on this site is truly white. */
const SHAFT =
  "linear-gradient(to right, rgba(242, 160, 60, 0) 0%, rgba(242, 160, 60, 0.2) 62%," +
  " rgba(242, 160, 60, 0.32) 100%)";
const SHAFT_SHAPE = "polygon(0% 47.4%, 50% 49.4%, 50% 50.6%, 0% 52.6%)";

export function WorkHero({ discipline }: { discipline: DisciplineMeta }) {
  const rootRef = useRef<HTMLElement>(null);
  const fan = FAN[discipline.id];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const word = root.querySelector<HTMLElement>("[data-hero-word]");
    const copy = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-copy]"));
    const bands = Array.from(root.querySelectorAll<HTMLElement>("[data-prism-band]"));
    const shaft = root.querySelector<HTMLElement>("[data-prism-shaft]");
    if (!word) return;

    // Nothing here is decorative in the sense of being optional content — the heading and
    // the claim are the page's first words — so with motion removed they are simply there,
    // in the light, with none of it moving.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([word, ...copy], { yPercent: 0, y: 0, opacity: 1, clipPath: "none" });
      bands.forEach((band, index) =>
        gsap.set(band, { clipPath: bandShape(index, fan.spread, true), opacity: 1 }),
      );
      if (shaft) gsap.set(shaft, { opacity: 1 });
      return;
    }

    gsap.set(word, { yPercent: 108, opacity: 0 });
    gsap.set(copy, { clipPath: "inset(0% 0% 100% 0%)", y: 16 });
    if (shaft) gsap.set(shaft, { opacity: 0, xPercent: -14 });
    bands.forEach((band, index) => {
      gsap.set(band, {
        clipPath: bandShape(index, fan.spread, false),
        opacity: 0,
        transformOrigin: "50% 50%",
      });
    });

    let entry: gsap.core.Timeline | undefined;
    const drift = gsap.timeline({ repeat: -1, yoyo: true, paused: true });

    // Held until the loader has gone — motion-system.md sequences the preloader's exit into
    // the headline reveal rather than starting both at once. On a click through from the
    // homepage the loader has already finished and this fires immediately.
    const unsubscribe = onLoaderReady(() => {
      entry = gsap.timeline({ defaults: { ease: "expo.out" } });

      // The light arrives first and the word rises into it, which is the right order for a
      // composition where the word is what the light is hitting.
      if (shaft) entry.to(shaft, { opacity: 1, xPercent: 0, duration: 1.1, ease: "power3.out" }, 0);
      bands.forEach((band, index) => {
        entry!.to(
          band,
          { clipPath: bandShape(index, fan.spread, true), opacity: 1, duration: 1.35 },
          0.42 + index * 0.06,
        );
      });

      entry
        .to(word, { yPercent: 0, opacity: 1, duration: 1.15 }, 0.25)
        .to(copy, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.8, stagger: 0.09 }, 0.95);
    });

    // The light never settles. Each band sways about the apex on its own period so the set
    // has no loop a viewer can catch — the same device the closing beam uses.
    bands.forEach((band, index) => {
      drift.to(
        band,
        {
          rotation: fan.sway * (index % 2 === 0 ? 1 : -1) * 0.5,
          duration: fan.period + index * 0.9,
          ease: "sine.inOut",
        },
        0,
      );
    });

    // Paused off screen: a blended layer that transforms every frame re-composites every
    // frame. Observed rather than ScrollTriggered — naming that plugin in a component file
    // pulls a second copy of it into the page chunk.
    const watcher = new IntersectionObserver(
      ([record]) => (record.isIntersecting ? drift.play() : drift.pause()),
      { threshold: 0 },
    );
    watcher.observe(root);

    return () => {
      unsubscribe();
      watcher.disconnect();
      entry?.kill();
      drift.kill();
    };
  }, [discipline.id, fan.spread, fan.sway, fan.period]);

  return (
    <section
      ref={rootRef}
      data-eyebrow-surface
      // The ground is painted here and it is load-bearing: a multiplying layer with no
      // ground beneath it composites as a flat wash instead of as light.
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-surface px-6 py-[16vh] md:px-[6vw]"
    >
      {/* Full bleed, behind everything. No z-index — an explicit one would form a second
          stacking context and isolate the blend. Paint order comes from the content's z-10. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <span
          data-prism-shaft
          className="absolute inset-0 block mix-blend-multiply will-change-transform"
          style={{ backgroundImage: SHAFT, clipPath: SHAFT_SHAPE }}
        />
        {BANDS.map((rgb, index) => (
          <span
            key={rgb}
            data-prism-band
            className="absolute inset-0 block mix-blend-multiply will-change-transform"
            style={{ backgroundImage: bandFill(rgb), clipPath: bandShape(index, fan.spread, true) }}
          />
        ))}
      </div>

      <span data-hero-copy className={`relative z-10 block ${EYEBROW_LIFT_HEADROOM}`}>
        <SectionEyebrow label={discipline.promise} />
      </span>

      {/* One word, so it takes the scale a one-word heading can — larger here than in the
          chapter it came from, because it has a whole frame to itself.

          The mask clips vertically only, and the padding is not decoration: leading below 1
          pulls the line box tighter than the glyphs, so the descender in "Design" would be
          sliced off by both the mask and the reveal. The negative margin keeps that room out
          of the layout, so the tight leading still reads as tight. */}
      <h1 className="relative z-10 m-0 mt-[3.5vh] text-center text-[clamp(3.75rem,15vw,14rem)] font-semibold leading-[0.84] tracking-[-0.055em] text-ink">
        <span className="-mb-[0.16em] block overflow-hidden pb-[0.16em]">
          <span data-hero-word className="block will-change-transform">
            {discipline.label}
          </span>
        </span>
      </h1>

      <p
        data-hero-copy
        className="relative z-10 m-0 mt-[5vh] max-w-[34ch] text-center text-[clamp(1rem,1.8vw,1.3125rem)] font-medium leading-[1.45] tracking-[-0.02em] text-ink"
      >
        {discipline.claim}
      </p>
    </section>
  );
}
