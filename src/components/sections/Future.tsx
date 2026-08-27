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

export function Future() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>("[data-future-word]"));
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

        if (still) {
          gsap.set(words, { yPercent: 0, opacity: 1 });
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-[14vh] motion-safe:min-[820px]:sticky motion-safe:min-[820px]:top-0 motion-safe:min-[820px]:h-screen motion-safe:min-[820px]:py-0">
        {/* The display size lives here, not on a child. `ch` resolves against the element's
            own font-size, so a measure set here while the size sat on the inner span was
            being computed against the inherited 16px — a ~128px box that wrapped every word
            onto its own line and left the masks clipping them sideways. */}
        <h2 className="m-0 max-w-[18ch] text-center text-[clamp(2.5rem,10vw,9rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-ink">
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
