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
 * Chapter 3 owns the spread-radial composition, so this one is deliberately not that shape.
 * It is top-anchored and directional, and the closing line stands in the light rather than
 * in front of it.
 *
 * The cone is a clip-path polygon with defined sides. An earlier pass softened those sides
 * with a wide conic mask and added a glow around the mouth; both were arguing with the
 * shape, and together they turned the beam into haze. The edges are meant to be legible —
 * this is a beam, not an atmosphere.
 *
 * The fall carries colour to the bottom edge rather than dissolving before it. Fading out
 * early left the beam hanging in the middle of the section with clear paper beneath it,
 * which reads as an unfinished gradient rather than as light reaching the floor.
 *
 * Hue travels down the fall — amber at the mouth, magenta through the middle, cyan as it
 * disperses — so the light cools with distance.
 *
 * The beam never settles. It sways about its own mouth and breathes across a different
 * period, so the two never line up and the motion has no loop you can catch. Scroll opens
 * the cone; this is what keeps it alive once it is open.
 */
/** Degrees either side of true vertical. Small enough to read as drift, not as a searchlight. */
const BEAM_SWAY_DEG = 2.6;
const BEAM_GRADIENT =
  "linear-gradient(to bottom," +
  " rgba(242, 160, 60, 0.5) 0%," +
  " rgba(232, 71, 155, 0.32) 38%," +
  " rgba(31, 191, 212, 0.16) 68%," +
  " rgba(31, 191, 212, 0.07) 100%)";

/**
 * Sized to the word, not to the section. The spread is set so the cone measures roughly 58%
 * of the frame where "remarkable." sits — about the width of the word itself at this type
 * scale — rather than washing the whole width. It keeps widening past that point so it still
 * reaches the floor, but the light belongs to the line, not to the room.
 */
const BEAM_CLOSED = "polygon(46% 0%, 54% 0%, 70% 100%, 30% 100%)";
const BEAM_OPEN = "polygon(38% 0%, 62% 0%, 89% 100%, 11% 100%)";

export function Future() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const words = Array.from(section.querySelectorAll<HTMLElement>("[data-future-word]"));
    const beam = section.querySelector<HTMLElement>("[data-future-beam]");
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
          if (beam) gsap.set(beam, { clipPath: BEAM_OPEN, opacity: 1 });
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
        // light. The cone itself opens, rather than a fixed shape being scaled: both
        // polygons carry the same four points in the same units, so the sides sweep outward
        // from the mouth as it widens.
        if (beam) {
          timeline.fromTo(
            beam,
            { clipPath: BEAM_CLOSED, opacity: 0 },
            { clipPath: BEAM_OPEN, opacity: 1, duration: 0.82, ease: "power2.out" },
            0.16,
          );
        }

        // Living motion, on transform rather than clip-path so it never contends with the
        // reveal above for the same property. Sway and breathe run at coprime-ish periods so
        // the pair never resynchronise into a visible loop.
        const drift = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
        if (beam) {
          gsap.set(beam, { transformOrigin: "50% 0%", rotation: -BEAM_SWAY_DEG });
          drift
            .to(beam, { rotation: BEAM_SWAY_DEG, duration: 9, ease: "sine.inOut" }, 0)
            .to(beam, { scaleX: 1.07, duration: 6.5, ease: "sine.inOut" }, 0);
        }

        // Paused while the section is off screen. A continuously transforming layer under
        // mix-blend-multiply re-composites every frame, and there is no reason to pay for
        // that where nobody is looking.
        //
        // Declared through the config rather than by importing ScrollTrigger here: the
        // plugin is registered once in LenisProvider, and naming the symbol in this file
        // pulled a second copy into the page chunk and cost 17kB.
        const presence = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => (self.isActive ? drift.play() : drift.pause()),
          },
        });

        return () => {
          drift.kill();
          presence.scrollTrigger?.kill();
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
      {/* A full screen on the phone too. At `min-h-[50vh]` the closing statement shared a
          scroll with whatever came next, which is the one thing a closing statement must not
          do — it is the last thing said, so it gets the room to be said in. */}
      <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-surface px-6 py-[14vh] motion-safe:min-[820px]:sticky motion-safe:min-[820px]:top-0 motion-safe:min-[820px]:h-screen motion-safe:min-[820px]:py-0">
        {/* No z-index: an explicit one would form a second stacking context and isolate the
            blend all over again. Paint order comes from the heading carrying z-10. */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <span
            data-future-beam
            className="absolute inset-0 block mix-blend-multiply will-change-transform"
            style={{ backgroundImage: BEAM_GRADIENT, clipPath: BEAM_OPEN }}
          />
        </div>

        {/* The display size lives here, not on a child. `ch` resolves against the element's
            own font-size, so a measure set here while the size sat on the inner span was
            being computed against the inherited 16px — a ~128px box that wrapped every word
            onto its own line and left the masks clipping them sideways. */}
        {/* 14vw on the phone rather than 10: at 393px that is the difference between a
            headline and a paragraph in bold. The cap is unchanged, so nothing moves above
            the breakpoint where 10vw was already large. */}
        <h2 className="relative z-10 m-0 max-w-[18ch] text-center text-[clamp(3rem,14vw,9rem)] font-semibold leading-[0.98] tracking-[-0.05em] text-ink min-[820px]:text-[clamp(2.5rem,10vw,9rem)]">
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
