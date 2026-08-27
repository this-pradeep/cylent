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
 * The closing wash: a beam cast down from above the frame.
 *
 * Chapter 3 owns the spread-radial composition — three fields drifting together — so this
 * one is deliberately not that shape at all. It is top-anchored and directional, with an
 * obvious light source off the top edge, and the closing line stands in the light rather
 * than in front of it.
 *
 * Built from ellipses centred *above* the frame rather than from a clipped cone. A polygon
 * gives the beam hard sides, and hard sides read as a shape rather than as light; an ellipse
 * whose centre sits off-screen spills downward and outward with no edge anywhere. Hue
 * travels with distance from that source — amber at the mouth, through magenta, into cyan as
 * it falls — so the beam has depth without needing three separate objects.
 *
 * Two layers: a defined core and a wider, fainter spill that lags behind it.
 *
 * This geometry also buys back the contrast headroom the three-field version spent. The
 * density is at the top of the frame while the headline sits at the middle, so the paper
 * behind "remarkable." stays far lighter than it did — which matters, because that word is
 * set in the accent gradient and the ramp is luminance-flat, so its legibility is decided
 * entirely by how light the ground under it is.
 */
const BEAMS = [
  {
    name: "core",
    gradient:
      "radial-gradient(ellipse 42% 92% at 50% -10%, rgba(242, 160, 60, 0.52) 0%, rgba(232, 71, 155, 0.36) 34%, rgba(31, 191, 212, 0.17) 62%, transparent 88%)",
  },
  {
    name: "spill",
    gradient:
      "radial-gradient(ellipse 82% 104% at 50% -18%, rgba(232, 71, 155, 0.26) 0%, rgba(31, 191, 212, 0.15) 46%, transparent 82%)",
  },
] as const;

export function Future() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>("[data-future-word]"));
    const beams = Array.from(section.querySelectorAll<HTMLElement>("[data-future-beam]"));
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
          gsap.set(beams, { scaleY: 1, opacity: 1 });
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

        // The beam trails the words rather than leading them — the sentence earns the
        // light. It extends from the top edge downward, so the origin is the mouth of the
        // beam and not its middle; the spill lags the core so the light arrives with depth.
        beams.forEach((beam, index) => {
          timeline.fromTo(
            beam,
            { scaleY: 0.34, opacity: 0, transformOrigin: "50% 0%" },
            {
              scaleY: 1,
              opacity: 1,
              duration: 0.76 + index * 0.1,
              ease: "power2.out",
              transformOrigin: "50% 0%",
            },
            0.16 + index * 0.1,
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
          {BEAMS.map((beam) => (
            <span
              key={beam.name}
              data-future-beam
              className="absolute inset-0 block mix-blend-multiply will-change-transform"
              style={{ backgroundImage: beam.gradient }}
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
