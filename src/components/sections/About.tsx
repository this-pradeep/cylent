"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";
import { STUDIO_LOCATION, STUDIO_TIME_ZONE } from "@/lib/site/studio";
import { studioClock, sunOverStudio } from "@/lib/three/sun";
import {
  EYEBROW_LIFT_HEADROOM,
  SectionEyebrow,
} from "@/components/SectionEyebrow";

/**
 * Chapter 3 — Our Philosophy.
 *
 * The hero commits to three disciplines and one studio, so this section takes the part the
 * hero leaves unsaid: *why* they are one. They are one because they happen in one room — and
 * the room is the studio's own, lit by the sun over Indore at the minute a visitor arrives.
 *
 * That is the whole argument, made spatially. `website-story.md` asks this chapter to be
 * experienced rather than explained, and the previous treatment explained it: three coloured
 * fields drifting until they intersected. `overlap.ts`, now deleted, said why that never
 * worked in its own comment — an even triangle of three circles is a Venn diagram, and a Venn
 * diagram is a consultancy slide.
 *
 * Held in place with CSS `sticky` rather than a GSAP pin, as before. No section on this page
 * pins.
 *
 * Nothing in here writes a transform to a blended layer. The three `mix-blend-multiply`
 * fields that used to move on every frame of the scrub are gone, and the light is a handful
 * of shader uniforms instead — which is what makes the section smooth rather than merely
 * cheaper.
 */

/**
 * The room is enhancement. Dynamically imported so `three` stays out of the first-load
 * bundle, exactly as the hero does it, and the section is complete and readable before it
 * arrives.
 */
const RoomScene = dynamic(
  () => import("@/components/three/RoomScene").then((m) => m.RoomScene),
  { ssr: false },
);

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  /**
   * The studio's clock, filled in after mount.
   *
   * Rendering it on the server would stamp the server's instant into the HTML and then
   * disagree with the browser's, and a hydration mismatch over a wall clock is not worth a
   * single frame of having it early.
   */
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    setClock(studioClock(new Date(), STUDIO_TIME_ZONE));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const query = <T extends HTMLElement>(selector: string) =>
      section.querySelector<T>(selector);
    const queryAll = <T extends HTMLElement>(selector: string) =>
      Array.from(section.querySelectorAll<T>(selector));

    const lead = queryAll("[data-about-lead]");
    const rule = query("[data-about-rule]");
    const payoff = query("[data-about-payoff]");
    const support = queryAll("[data-about-support]");
    if (!rule || !payoff) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        moving: "(prefers-reduced-motion: no-preference)",
        still: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { still } = context.conditions as Record<string, boolean>;

        if (still) {
          gsap.set([...lead, payoff, ...support], {
            clipPath: "none",
            y: 0,
            opacity: 1,
          });
          gsap.set(rule, { scaleX: 1 });
          return;
        }

        /**
         * The headline is not revealed. It is lit.
         *
         * The wipe runs in the direction the light is actually coming from, which is why this
         * reads the sun rather than picking a side: a morning sun throws the shaft in from the
         * east and the words have to appear the same way. One event explaining two things is
         * what `motion-system.md` means by intentional movement, as against a reveal bolted
         * on to a reveal.
         *
         * Read here rather than passed down from the room, because both are deriving it from
         * the same pure function and neither needs to know the other exists.
         */
        const fromEast = sunOverStudio(new Date()).azimuth < 180;
        const closed = fromEast
          ? "inset(0% 100% 0% 0%)"
          : "inset(0% 0% 0% 100%)";

        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            // Where it was. A held section's scrub does not begin until its top reaches the
            // top of the viewport, a full screen after the content is already visible, so
            // the arrival cannot be driven off the scrub without leaving the section blank
            // the whole way in.
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          })
          .fromTo(
            lead,
            { clipPath: "inset(0% 0% 100% 0%)", y: 16 },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              duration: 0.75,
              stagger: 0.09,
            },
            0,
          )
          .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.95 }, 0.1)
          // Timed to land inside the room's own settle, which runs 1.4s from the same
          // trigger. The light reaches the words while it is still arriving.
          .fromTo(
            payoff,
            { clipPath: closed },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.25, ease: "expo.out" },
            0.45,
          )
          .fromTo(
            support,
            { clipPath: "inset(0% 0% 100% 0%)", y: 14 },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              duration: 0.7,
              stagger: 0.1,
            },
            1.0,
          );
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      data-eyebrow-surface
      className="relative isolate bg-surface motion-safe:min-[900px]:h-[190vh]"
    >
      <div className="relative flex flex-col gap-[7vh] overflow-hidden bg-surface px-6 py-[16vh] md:px-[6vw] motion-safe:min-[900px]:sticky motion-safe:min-[900px]:top-0 motion-safe:min-[900px]:h-screen motion-safe:min-[900px]:justify-center motion-safe:min-[900px]:py-0">
        {/* The room, full bleed, behind everything. Two draw calls, and it sleeps the moment
            the section leaves the viewport. */}
        <RoomScene sectionRef={sectionRef} />

        <div className="relative z-10 flex flex-col gap-4">
          <span data-about-lead className={`block ${EYEBROW_LIFT_HEADROOM}`}>
            <SectionEyebrow label="Who we are" />
          </span>
          <span
            data-about-rule
            aria-hidden="true"
            className="block h-px w-full origin-left bg-[image:var(--gradient-accent)]"
          />
        </div>

        <div className="relative z-10 flex max-w-[46ch] flex-col gap-7">
          {/*
            Full ink, and no opacity anywhere in this section.

            The ground behind these words moves with the hour. `room-light.ts` clamps it so
            --color-ink holds 4.5:1 against the darkest room the clock can produce, and that
            floor is computed for ink at full strength — an `ink/70` would spend the whole
            margin the clamp exists to protect.
          */}
          {/*
            COPY — yours to write. The design wants this line affirmative: the room already
            shows one place, so the headline can say what is true rather than what is not.
            Left as the line that was here until you replace it.
          */}
          <h2
            data-about-payoff
            className="m-0 text-[clamp(2.75rem,7.5vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-ink"
          >
            Great work doesn&rsquo;t happen in silos.
          </h2>

          {/*
            One line where there were four plus two paragraphs. The stanza it replaces —
            "between ideas and execution / between technology and design / between strategy
            and storytelling" — was stating spatially what it could not show. The room shows
            one space, so the stanza would be narrating what is already on screen.
          */}
          <p
            data-about-support
            className="m-0 text-[clamp(1.0625rem,2.2vw,1.375rem)] font-medium leading-[1.45] tracking-[-0.02em] text-ink"
          >
            We bring different disciplines together to create digital experiences, brands,
            and stories that feel as good as they work.
          </p>

          {/* Promoted out of the footnote it used to be. The place is the subject of this
              section now, so it is named beside the studio's own clock rather than stamped
              at the bottom in passing. Read from `studio.ts` — two copies of somewhere we
              might move is two chances to be wrong about it. */}
          <p
            data-about-support
            className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink"
          >
            <span>Cylent &mdash; a creative technology studio from {STUDIO_LOCATION}</span>
            {/* Reserves its own width so the line does not reflow when the clock lands. */}
            <span className="tabular-nums" aria-hidden={clock === null}>
              {clock ?? " "}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
