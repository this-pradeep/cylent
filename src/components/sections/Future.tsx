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
 * The closing wash: a beam cast down from a source above the frame.
 *
 * Chapter 3 owns the spread-radial composition, so this one is deliberately not that shape.
 * It is top-anchored and directional, and the closing line stands in the light rather than
 * in front of it.
 *
 * The cone is cut by a conic gradient used as a mask, not by a clip-path polygon. A polygon
 * gives the beam hard sides and hard sides read as a triangle rather than as light; a conic
 * mask spreads from the same apex but its edges fall off over a few degrees, so the beam has
 * a real shape and no visible boundary. (An earlier pass tried to solve the hard sides by
 * dropping the cone for off-screen ellipses — that removed the edges by removing the beam.)
 *
 * In CSS conic terms 0deg points up, so the wedge is centred on 180deg: opaque across 40
 * degrees, feathered over 18 either side. Those numbers are the difference between a beam
 * and a haze — a narrow core inside a wide feather has no visible taper at all, it just
 * reads as a bright spine. At this spread the cone is about 20px across where it enters the
 * frame and roughly 700px at the foot of a tall viewport, which is the taper doing the work.
 *
 * Hue travels down the fall rather than across it — amber at the mouth, magenta through the
 * middle, cyan as it disperses — so the beam reads as light cooling with distance.
 */
const BEAM_APEX = "50% -6%";

const BEAM_CONE =
  `conic-gradient(from 0deg at ${BEAM_APEX},` +
  " transparent 142deg, rgba(0,0,0,0.5) 156deg, #000 160deg," +
  " #000 200deg, rgba(0,0,0,0.5) 204deg, transparent 218deg)";

const BEAMS = [
  {
    name: "core",
    /** Cut to the cone. This is the beam itself. */
    cone: true,
    gradient:
      "linear-gradient(to bottom, rgba(242, 160, 60, 0.6) 0%, rgba(232, 71, 155, 0.4) 34%," +
      " rgba(31, 191, 212, 0.2) 62%, transparent 92%)",
  },
  {
    name: "mouth",
    /** Uncut: the glow around the source, which seats the beam instead of letting it start
        out of nowhere at the top edge. */
    cone: false,
    gradient:
      "radial-gradient(ellipse 46% 40% at 50% -8%, rgba(242, 160, 60, 0.34) 0%," +
      " rgba(232, 71, 155, 0.16) 46%, transparent 78%)",
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
          gsap.set(beams, { scaleX: 1, scaleY: 1, opacity: 1 });
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
        // light. It widens and lengthens from the apex, so the origin is the mouth and not
        // the middle, and the glow lags the beam so the source lights before the fall does.
        beams.forEach((beam, index) => {
          timeline.fromTo(
            beam,
            { scaleX: 0.42, scaleY: 0.55, opacity: 0, transformOrigin: "50% 0%" },
            {
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              duration: 0.78 + index * 0.1,
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
              style={{
                backgroundImage: beam.gradient,
                // Both spellings: Safari still wants the prefixed property for masks.
                ...(beam.cone
                  ? { maskImage: BEAM_CONE, WebkitMaskImage: BEAM_CONE }
                  : {}),
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
