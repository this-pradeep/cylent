"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Chapter 8 — the closing statement, revealed a word at a time as the section is scrolled.
 *
 * The words are written out rather than split from a string at runtime so the markup is
 * what it looks like, and the whole line is repeated to assistive tech as one sentence —
 * a flex row of separately-masked words is not reliably read as continuous prose.
 */
const WORDS = ["Let’s", "create", "something", "remarkable."] as const;

/** The one word the sentence is actually about, so it is the one carrying the accent. */
const HIGHLIGHT = "remarkable.";

const SENTENCE = WORDS.join(" ");

/**
 * The closing wash. Where Chapter 3 has three fields converging inward, this one radiates:
 * a single halo blooming out past the words as the line completes. Converge, then radiate —
 * the two chromatic moments on the page argue opposite directions on purpose, so the last
 * one does not read as the first one repeated.
 *
 * A halo rather than a disc, and that is what makes it work at all. The words sit in the
 * clear centre while the colour blooms around them, so the line the section exists to
 * deliver is never asked to compete with the ground it sits on — and "remarkable." can keep
 * the accent gradient, which needs the paper under it to stay light.
 *
 * Hues are the accent's own three stops rather than Chapter 3's RGB. Both sections get a
 * chromatic moment; neither gets the same palette.
 */
const HALOS = [
  { rgb: "169, 59, 157", x: "38%", y: "44%", scale: 1 },
  { rgb: "104, 83, 212", x: "58%", y: "56%", scale: 1.14 },
  { rgb: "8, 115, 127", x: "50%", y: "38%", scale: 0.88 },
] as const;

/** Clear core, colour at the rim, gone by the edge. */
const HALO_STOPS = "transparent 0%, transparent 26%, rgba(RGB, 0.34) 46%, rgba(RGB, 0.16) 66%, transparent 88%";

function haloGradient(rgb: string): string {
  return `radial-gradient(circle at 50% 50%, ${HALO_STOPS.replaceAll("RGB", rgb)})`;
}

export function Future() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>("[data-future-word]"));
    const halos = Array.from(section.querySelectorAll<HTMLElement>("[data-future-halo]"));
    if (words.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        held: "(min-width: 820px) and (prefers-reduced-motion: no-preference)",
        flowing: "(max-width: 819px) and (prefers-reduced-motion: no-preference)",
        still: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { held, still } = context.conditions as Record<string, boolean>;

        // Centring lives in GSAP's transform, not in a Tailwind translate. GSAP writes
        // `transform` wholesale, so a class-based translate would be clobbered the first
        // time a halo was scaled.
        gsap.set(halos, { xPercent: -50, yPercent: -50 });

        if (still) {
          gsap.set(words, { yPercent: 0, opacity: 1 });
          gsap.set(halos, { scale: 1, opacity: 1 });
          return;
        }

        // Each word rises out from behind its own mask. A single staggered tween on a
        // timeline of duration 1 maps the whole line onto the scrub, so reading speed is
        // scroll speed and the sentence finishes with room to spare.
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: held ? "top top" : "top 80%",
            end: held ? "bottom bottom" : "bottom 60%",
            scrub: 0.9,
          },
        });

        timeline.fromTo(
          words,
          { yPercent: 108, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.42,
            ease: "power3.out",
            stagger: { each: (1 - 0.42) / Math.max(words.length - 1, 1) },
          },
          0,
        );

        // The bloom trails the words rather than leading them — the sentence earns the
        // colour, and each halo opens at its own rate so the wash never reads as one disc
        // being scaled.
        halos.forEach((halo, index) => {
          timeline.fromTo(
            halo,
            { scale: 0.24, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.72 + index * 0.08, ease: "power2.out" },
            0.16 + index * 0.06,
          );
        });

        return () => {
          timeline.scrollTrigger?.kill();
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-surface motion-safe:min-[820px]:h-[170vh]"
    >
      {/* The wrapper paints its own ground because `position: sticky` forms a stacking
          context, and a stacking context isolates blending — without a background here the
          halos would have nothing to multiply against and would flatten into plain washes. */}
      <div className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden bg-surface px-6 py-[14vh] motion-safe:min-[820px]:sticky motion-safe:min-[820px]:top-0 motion-safe:min-[820px]:h-screen motion-safe:min-[820px]:py-0">
        {/* No z-index: an explicit one would form a second stacking context and isolate the
            blend all over again. Paint order comes from the heading carrying z-10. */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          {HALOS.map((halo) => (
            <span
              key={halo.rgb}
              data-future-halo
              className="absolute block aspect-square w-[104%] min-w-[680px] mix-blend-multiply will-change-transform"
              style={{
                left: halo.x,
                top: halo.y,
                backgroundImage: haloGradient(halo.rgb),
              }}
            />
          ))}
        </div>

        {/* The display size lives here, not on a child. `ch` resolves against the element's
            own font-size, so a measure set here while the size sat on the inner span was
            being computed against the inherited 16px — a ~128px box that wrapped every word
            onto its own line and left the masks clipping them sideways. */}
        <h2 className="relative z-10 m-0 max-w-[18ch] text-center text-[clamp(2.5rem,10vw,9rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-ink">
          <span className="sr-only">{SENTENCE}</span>

          <span
            aria-hidden="true"
            className="flex flex-wrap items-end justify-center gap-x-[0.26em]"
          >
            {WORDS.map((word) => (
              // The mask is the outer span, and it must only ever clip vertically. It holds
              // its width against the flex line (`shrink-0`) and refuses to break the word
              // inside it, because `overflow-hidden` clips both axes and a squeezed box
              // takes the ends off the word rather than wrapping it.
              //
              // The padding buys room for descenders and the gradient's clipped glyph edges;
              // the matching negative margin keeps that room out of the line box so the
              // words still sit on one baseline.
              <span
                key={word}
                className="inline-block shrink-0 overflow-hidden whitespace-nowrap pb-[0.14em] -mb-[0.14em]"
              >
                <span
                  data-future-word
                  className={`inline-block will-change-transform ${
                    word === HIGHLIGHT ? "text-gradient" : ""
                  }`}
                >
                  {word}
                </span>
              </span>
            ))}
          </span>
        </h2>
      </div>
    </section>
  );
}
