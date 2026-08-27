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
 * The closing wash.
 *
 * Subtractive primaries — cyan, magenta and amber — where Chapter 3 uses additive ones. RGB
 * is how a screen makes colour and CMY is how ink does, so the page's two chromatic moments
 * are the studio's two halves: the thing on the screen and the thing that gets printed.
 * It also buys the one property that actually makes a wash beautiful, which is hue
 * separation. The first pass here ran magenta, violet and cyan — three cool neighbours,
 * stacked near the middle — and three neighbouring hues multiplied together do not make a
 * gradient, they make lavender.
 *
 * Each field owns a corner of the frame and the centre is left to their tails. That is
 * deliberate and it is load-bearing. "remarkable." is set in the accent gradient, and that
 * ramp is luminance-flat at about 0.139 by design, so its contrast is decided entirely by
 * how light the paper under it stays. With the cores this far out the middle lands near 0.64
 * and the ramp holds 3.66:1 against display type. The cliff is close:
 *
 *   tails of 0.13 each → 3.66:1   ✓
 *   tails of 0.18 each → 3.17:1   ✓
 *   tails of 0.22 each → 2.82:1   ✗  fails the 3:1 large-text minimum
 *
 * So pulling a core toward the centre, or raising the first stop, is not a taste change —
 * it is the headline going illegible. If the wash needs to be denser, the honest move is to
 * take "remarkable." off the gradient and set it in ink.
 */
const FIELDS = [
  { name: "cyan", rgb: "31, 191, 212", x: -34, y: -26 },
  { name: "amber", rgb: "242, 160, 60", x: 36, y: -24 },
  { name: "magenta", rgb: "232, 71, 155", x: 2, y: 36 },
] as const;

/** Five stops: at this size a three-stop radial bands, and banding reads as printed. */
const FIELD_STOPS: readonly { at: number; alpha: number }[] = [
  { at: 0, alpha: 0.55 },
  { at: 26, alpha: 0.34 },
  { at: 52, alpha: 0.18 },
  { at: 74, alpha: 0.05 },
  { at: 90, alpha: 0 },
];

function fieldGradient(rgb: string): string {
  const stops = FIELD_STOPS.map(({ at, alpha }) => `rgba(${rgb}, ${alpha}) ${at}%`).join(", ");
  return `radial-gradient(circle at 50% 50%, ${stops})`;
}

export function Future() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>("[data-future-word]"));
    const fields = Array.from(section.querySelectorAll<HTMLElement>("[data-future-field]"));
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

        // Placement lives in GSAP's transform, not in Tailwind translate utilities. GSAP
        // writes `transform` wholesale, so a class-based translate would be clobbered the
        // first time a field was scaled. The -50 is the centring; the rest is the layout.
        fields.forEach((field, index) => {
          const spot = FIELDS[index];
          if (!spot) return;
          gsap.set(field, { xPercent: -50 + spot.x, yPercent: -50 + spot.y });
        });

        if (still) {
          gsap.set(words, { yPercent: 0, opacity: 1 });
          gsap.set(fields, { scale: 1, opacity: 1 });
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
        // colour — and each field opens at its own rate so the wash never reads as one disc
        // being scaled. Blooming outward, where Chapter 3 gathers inward.
        fields.forEach((field, index) => {
          timeline.fromTo(
            field,
            { scale: 0.3, opacity: 0 },
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
          {FIELDS.map((field) => (
            <span
              key={field.name}
              data-future-field
              className="absolute left-1/2 top-1/2 block aspect-square w-[86%] min-w-[600px] mix-blend-multiply will-change-transform"
              style={{ backgroundImage: fieldGradient(field.rgb) }}
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
