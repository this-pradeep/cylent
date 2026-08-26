"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ABSORB_END, consumeWindow, remainingAt } from "@/lib/motion/converge";
import { STUDIO_LOCATION } from "@/lib/site/studio";

/**
 * Chapter 3 — Our Philosophy. Most companies treat development, video, photography and
 * design as four separate services; we treat them as one experience. The section performs
 * that argument rather than asserting it: each craft is consumed into the one above it and
 * the counter falls 04 → 01, so "Four crafts. One studio." is watched rather than read.
 *
 * The scrub hands the sequence to the visitor — per the motion system, scrolling should
 * reveal a story rather than expose content. Held in place with CSS `sticky` rather than a
 * GSAP pin: Pillars pins a full-screen track immediately after this section, and a second
 * pin competing across that boundary on every refresh is a known source of jitter.
 */
const CRAFTS = ["Web Development", "Videography", "Photography", "Graphic Design"] as const;

const pad = (value: number) => String(value).padStart(2, "0");

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const query = <T extends HTMLElement>(selector: string) =>
      section.querySelector<T>(selector);
    const queryAll = <T extends HTMLElement>(selector: string) =>
      Array.from(section.querySelectorAll<T>(selector));

    const masthead = queryAll("[data-about-lead]");
    const rule = query("[data-about-rule]");
    const rows = queryAll("[data-about-craft]");
    const count = query("[data-about-count]");
    const noun = query("[data-about-noun]");
    const resolve = query("[data-about-resolve]");
    if (!rule || !count || !noun || !resolve || rows.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        held: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
        flowing: "(max-width: 899px) and (prefers-reduced-motion: no-preference)",
        still: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { held, still } = context.conditions as Record<string, boolean>;

        // With motion removed the absorption has nothing to show, so the section states its
        // conclusion outright and keeps every craft on the page.
        if (still) {
          gsap.set([...masthead, ...rows, resolve], { clipPath: "none", y: 0, opacity: 1 });
          gsap.set(rule, { scaleX: 1 });
          count.textContent = pad(1);
          noun.textContent = "studio";
          return;
        }

        // Measured rather than assumed: the rows are clamp-sized, so their pitch changes
        // with the viewport and a hard-coded step would leave a line short of the one it is
        // being absorbed into. Read as a function so `invalidateOnRefresh` picks up the
        // remeasure after a resize or a late font swap.
        const rowPitch = () => (rows.length > 1 ? rows[1].offsetTop - rows[0].offsetTop : 0);

        let shown = -1;
        const tick = (progress: number) => {
          const remaining = remainingAt(progress, rows.length);
          if (remaining === shown) return;
          shown = remaining;
          count.textContent = pad(remaining);
          noun.textContent = remaining === 1 ? "studio" : "crafts";
          // The numeral drops into place as it changes, so the tick is felt, not just read.
          gsap.fromTo(
            count,
            { yPercent: -9, opacity: 0.35 },
            { yPercent: 0, opacity: 1, duration: 0.4, ease: "power3.out", overwrite: true },
          );
        };

        // Total duration of 1 maps the timeline directly onto the scrub's own progress, so
        // the windows in converge.ts are the timeline's positions with no conversion.
        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger: section,
            start: held ? "top top" : "top 78%",
            end: held ? "bottom bottom" : "bottom 65%",
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => tick(self.progress),
          },
        });

        timeline
          .fromTo(
            masthead,
            { clipPath: "inset(0% 0% 100% 0%)", y: 16 },
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.13, stagger: 0.03 },
            0,
          )
          .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.2 }, 0.02)
          .fromTo(
            rows,
            { clipPath: "inset(0% 0% 100% 0%)", y: 20 },
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.12, stagger: 0.04 },
            0.06,
          );

        // Each craft rises exactly one row and is clipped away into the line above. One row
        // and no further: a line that travelled to a shared baseline would pass through the
        // others and land as unreadable overlap.
        rows.forEach((row, index) => {
          const window = consumeWindow(index, rows.length);
          if (!window) return;
          timeline.to(
            row,
            {
              y: () => -rowPitch(),
              clipPath: "inset(0% 0% 100% 0%)",
              duration: window.end - window.start,
              ease: "power2.inOut",
            },
            window.start,
          );
        });

        timeline
          .to(
            rows[0],
            { y: -10, clipPath: "inset(0% 0% 100% 0%)", duration: 0.08, ease: "power2.in" },
            ABSORB_END,
          )
          .fromTo(
            resolve,
            { clipPath: "inset(100% 0% 0% 0%)", y: 12 },
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.12, ease: "expo.out" },
            ABSORB_END + 0.06,
          );

        return () => {
          shown = -1;
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative isolate bg-surface motion-safe:min-[900px]:h-[190vh]"
    >
      <div className="flex flex-col justify-center gap-[8vh] px-6 py-[16vh] md:px-[6vw] motion-safe:min-[900px]:sticky motion-safe:min-[900px]:top-0 motion-safe:min-[900px]:h-screen motion-safe:min-[900px]:gap-[7vh] motion-safe:min-[900px]:py-0">
        {/* Masthead. The rule runs the full measure, which is what sets the spread below it. */}
        <div className="flex flex-col gap-4">
          <p
            data-about-lead
            className="m-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted"
          >
            Section 02 — Who we are
          </p>
          <span
            data-about-rule
            aria-hidden="true"
            className="block h-px w-full origin-left bg-[image:var(--gradient-accent)]"
          />
        </div>

        <div className="grid gap-12 min-[900px]:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] min-[900px]:items-start min-[900px]:gap-[5vw]">
          {/* The count is the headline. "Four crafts. One studio." is the journey it takes,
              so stating it again in a heading would be saying the same thing twice. */}
          <div className="flex flex-col gap-8">
            <h2 className="m-0 flex flex-col gap-2" data-about-lead>
              <span className="sr-only">Four crafts. One studio.</span>
              <span
                data-about-count
                aria-hidden="true"
                className="text-gradient block text-[clamp(4.5rem,13vw,10rem)] font-semibold leading-[0.8] tracking-[-0.05em] tabular-nums"
              >
                04
              </span>
              <span
                data-about-noun
                aria-hidden="true"
                className="block font-mono text-[0.8125rem] uppercase tracking-[0.22em] text-ink-muted"
              >
                crafts
              </span>
            </h2>

            <div className="flex flex-col gap-4" data-about-lead>
              <p className="m-0 max-w-[32ch] text-[0.9375rem] leading-[1.75] text-ink-muted">
                Technology creates functionality. Design creates emotion. The best brands
                need both.
              </p>
              <p className="m-0 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-muted">
                A creative studio in {STUDIO_LOCATION}
              </p>
            </div>
          </div>

          {/* The list as every agency prints it — until it stops being four things. */}
          <div className="relative min-[900px]:pt-[0.6rem]">
            <ul className="m-0 flex list-none flex-col gap-5 p-0 min-[900px]:gap-6">
              {CRAFTS.map((craft, index) => (
                <li
                  key={craft}
                  data-about-craft
                  className="m-0 flex items-baseline gap-5 will-change-transform"
                >
                  <span className="font-mono text-[0.6875rem] tabular-nums tracking-[0.18em] text-ink-muted">
                    {pad(index + 1)}
                  </span>
                  <span className="text-[clamp(1.5rem,3.4vw,2.6rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-ink">
                    {craft}
                  </span>
                </li>
              ))}
            </ul>

            {/* Deliberately off the index column the rows are set to. The grid holds for the
                four; the thing they become is what breaks it. */}
            <p
              data-about-resolve
              className="text-gradient absolute left-0 top-0 m-0 motion-reduce:static motion-reduce:mt-10 text-[clamp(1.8rem,4.2vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.04em] will-change-transform"
            >
              One experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
