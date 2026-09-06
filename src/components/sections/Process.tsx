"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { EYEBROW_LIFT_HEADROOM, SectionEyebrow } from "@/components/SectionEyebrow";
import {
  PROCESS_EYEBROW,
  PROCESS_HEADING,
  PROCESS_STAGES,
  PROCESS_SUBHEAD,
} from "@/lib/site/process";
import { drawExtent, stationReveal } from "@/lib/motion/process-stations";

/**
 * Chapter 7 — The Process.
 *
 * `website-story.md` records that Chapters 5 and 7 both carried the **Confidence** beat and
 * both were cut, leaving the page to move from what we make straight to the ask. This is
 * that beat, claimed back in Chapter 7's slot — after the proof, before the close, which is
 * where it answers the question the work provokes rather than pre-empting it.
 *
 * The section is one hairline drawn across it, with the four stages as stations on the
 * line. A process is a thing with an order, and a line drawn through four points states
 * that order without a word of it being claimed.
 *
 * Deliberately not Chapter 3's language. That section is radial — fields blooming and
 * gathering; this one is linear. Two abstract diagrams on one page have to read as
 * different instruments, and radial-against-linear is the cleanest separation there is.
 * Both draw on `--gradient-accent`, so they still belong to one system.
 *
 * Paper rather than ink. `design-principles.md` Principle 2 asks for contrast and Chapter 6
 * already spends it on three full-bleed ink frames; a fourth dark slab would dilute those
 * rather than add to them, and Chapter 8's beam needs a light ground to fall on. The
 * quieter ground suits the content too — this is the studio talking about itself, and it
 * should be quieter than the work.
 *
 * Held with CSS `sticky`, like every other section here. Nothing on this page pins.
 */

/** Matches Work.tsx, so the two neighbouring sections change layout on the same line. */
const HELD = "(min-width: 820px) and (prefers-reduced-motion: no-preference)";
const FLOWING = "(max-width: 819px) and (prefers-reduced-motion: no-preference)";
const STILL = "(prefers-reduced-motion: reduce)";

export function Process() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const queryAll = <T extends HTMLElement>(selector: string) =>
      Array.from(section.querySelectorAll<T>(selector));

    const rail = section.querySelector<HTMLElement>("[data-process-rail]");
    const spine = section.querySelector<HTMLElement>("[data-process-spine]");
    const stations = queryAll("[data-process-station]");
    const dots = queryAll("[data-process-dot]");
    const intro = queryAll("[data-process-intro]");
    if (!rail || !spine || stations.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add({ held: HELD, flowing: FLOWING, still: STILL }, (context) => {
      const { held, still } = context.conditions as Record<string, boolean>;

      // The stages are content, not decoration. With motion removed the line is simply
      // drawn and all four stations are simply there.
      if (still) {
        gsap.set([rail, spine], { clipPath: "none", opacity: 1 });
        gsap.set([...intro, ...stations], { clipPath: "none", opacity: 1, y: 0 });
        gsap.set(dots, { opacity: 1, scale: 1 });
        return;
      }

      gsap.set(stations, { opacity: 0, y: 18 });
      gsap.set(dots, { opacity: 0, scale: 0.3 });

      // The heading belongs to the arrival, not to the scrub — the section would otherwise
      // sit blank for a full screen before it said anything.
      const arrival = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });
      arrival.fromTo(
        intro,
        { clipPath: "inset(0% 0% 100% 0%)", y: 16 },
        { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.8, stagger: 0.1 },
        0,
      );

      // A total duration of 1 maps this timeline straight onto the scrub, so the windows in
      // process-stations.ts are the timeline's own positions with no conversion — the same
      // arrangement Chapter 6 uses for its beats.
      const draw = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: held ? "top top" : "top 74%",
          end: held ? "bottom bottom" : "bottom 70%",
          scrub: 0.9,
          invalidateOnRefresh: true,
          // Written from `drawExtent` rather than tweened, so that function stays the only
          // description of where the front is — the arrangement About.tsx uses for its
          // fields. A station's own window is derived from the same number, which is what
          // makes "the station lights as the line reaches it" true by construction rather
          // than by tuning.
          onUpdate: (self) => {
            const hidden = (1 - drawExtent(self.progress)) * 100;
            // The gradient must not move while the line grows. `scaleX` would squeeze the
            // whole five-stop ramp into whatever is drawn so far and light every station at
            // a colour it does not keep; clipping holds the ramp still and uncovers it.
            gsap.set(rail, { clipPath: `inset(0% ${hidden}% 0% 0%)` });
            gsap.set(spine, { clipPath: `inset(0% 0% ${hidden}% 0%)` });
          },
        },
      });

      stations.forEach((station, index) => {
        const window = stationReveal(index, stations.length);
        if (!window) return;
        const duration = window.end - window.start;

        draw.fromTo(
          station,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration, ease: "power3.out" },
          window.start,
        );
        const dot = dots[index];
        if (dot) {
          draw.fromTo(
            dot,
            { opacity: 0, scale: 0.3 },
            { opacity: 1, scale: 1, duration, ease: "back.out(2)" },
            window.start,
          );
        }
      });

      return () => {
        arrival.scrollTrigger?.kill();
        draw.scrollTrigger?.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-eyebrow-surface
      className="relative bg-paper motion-safe:min-[820px]:h-[170vh]"
    >
      <div className="flex flex-col justify-center gap-[7vh] overflow-hidden px-6 py-[16vh] md:px-[6vw] motion-safe:min-[820px]:sticky motion-safe:min-[820px]:top-0 motion-safe:min-[820px]:h-screen motion-safe:min-[820px]:py-0">
        <div className="flex flex-col gap-5">
          <span data-process-intro className={`block ${EYEBROW_LIFT_HEADROOM}`}>
            <SectionEyebrow label={PROCESS_EYEBROW} />
          </span>

          {/* No accent rule beneath the eyebrow, unlike Chapter 3. The drawn line is this
              section's rule, and a static hairline above one that draws reads as a fault. */}
          <h2
            data-process-intro
            className="m-0 max-w-[16ch] text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink"
          >
            {PROCESS_HEADING}
          </h2>

          <p
            data-process-intro
            className="m-0 max-w-[40ch] text-[clamp(1rem,2vw,1.25rem)] font-medium leading-[1.4] tracking-[-0.02em] text-ink/70"
          >
            {PROCESS_SUBHEAD}
          </p>
        </div>

        {/* The stations, and the line they sit on. The line is a separate decorative layer
            so the stages can stay one plain <ol> — no display:contents, no subgrid, no
            fixed heights, and nothing about the drawing constrains the markup that carries
            the meaning. */}
        <div className="relative">
          {/* Desktop: the line runs above the stations and they hang from it.
              `inset-x-0` spans the full content width, so the stations' own grid columns
              put each dot exactly where stationPosition() says it is. */}
          <span
            data-process-rail
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 hidden h-px bg-[image:var(--gradient-accent)] min-[820px]:block"
          />

          {/* Mobile: the same line turned vertical, a spine down the left of the column.
              Four stations across a phone would give each about 80px, which is not a
              column — vertical is the honest form at that width. */}
          <span
            data-process-spine
            aria-hidden="true"
            className="absolute bottom-0 left-[3px] top-0 block w-px bg-[image:var(--gradient-accent)] min-[820px]:hidden"
          />

          <ol className="m-0 grid list-none grid-cols-1 gap-y-10 p-0 min-[820px]:grid-cols-4 min-[820px]:gap-y-0 min-[820px]:pt-10">
            {PROCESS_STAGES.map((stage) => (
              <li
                key={stage.name}
                className="relative m-0 pl-9 min-[820px]:pl-0 min-[820px]:pr-[3vw]"
              >
                {/* The dot. Solid accent, never the ramp: globals.css sets the rule and
                    gives the reason — across something this small a gradient reads as an
                    arbitrary colour rather than as a gradient.

                    On mobile it sits on its own row's spine. On desktop it sits on the rail
                    above, at the head of its own column — which is exactly the position
                    stationPosition() reports, because both are the same grid. */}
                <span
                  data-process-dot
                  aria-hidden="true"
                  className="absolute left-0 top-[0.45em] block h-[7px] w-[7px] rounded-full bg-accent will-change-transform min-[820px]:-top-[calc(2.5rem+3px)] min-[820px]:left-0"
                />

                <div data-process-station className="flex flex-col gap-2 will-change-transform">
                  <p className="m-0 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
                    {stage.number}
                  </p>
                  <h3 className="m-0 text-[clamp(1.5rem,2.6vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
                    {stage.name}
                  </h3>
                  <p className="m-0 max-w-[30ch] text-[0.9375rem] leading-[1.55] text-ink/70">
                    {stage.line}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
