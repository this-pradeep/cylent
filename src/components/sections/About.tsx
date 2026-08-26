"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CRAFT_STEP_PX, convergeOffsets } from "@/lib/motion/converge";
import { STUDIO_LOCATION } from "@/lib/site/studio";

/**
 * Chapter 3 — Our Philosophy. Most companies treat development, video, photography and
 * design as four separate services; we treat them as one experience. The section makes that
 * argument by performing it: the four crafts enter as the service list every agency prints,
 * then collapse onto a single line. Nobody has to be told the four are one — they watch it.
 *
 * Deliberately short and open. Pillars pins a dark full-screen track immediately after, so
 * this beat is the stillness that sets it up.
 */
const CRAFTS = [
  "Web Development",
  "Videography",
  "Photography",
  "Graphic Design",
] as const;

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const heads = section.querySelectorAll("[data-about-head]");
    const lines = Array.from(section.querySelectorAll<HTMLElement>("[data-about-craft]"));
    const unified = section.querySelector("[data-about-unified]");
    const rule = section.querySelector("[data-about-rule]");
    if (!lines.length || !unified || !rule) return;

    const settle = () => {
      gsap.set(heads, { y: 0, opacity: 1 });
      gsap.set(lines, { y: 0, opacity: 0 });
      gsap.set(unified, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(rule, { scaleX: 1 });
    };

    // With motion removed the convergence has nothing to show, so the section states its
    // conclusion directly rather than animating it away.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      settle();
      return;
    }

    const ctx = gsap.context(() => {
      // Measured rather than assumed: the list is clamp-sized, so its rhythm changes with
      // the viewport and a hard-coded step would leave the lines short of the baseline.
      const step = lines.length > 1 ? lines[1].offsetTop - lines[0].offsetTop : CRAFT_STEP_PX;
      const offsets = convergeOffsets(lines.length, step || CRAFT_STEP_PX);

      gsap.set(lines, { y: 18, opacity: 0 });
      gsap.set(unified, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 65%",
          toggleActions: "play none none reverse",
        },
      });

      timeline
        .from(heads, { y: 26, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.09 })
        .to(lines, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.08 }, 0.25)
        // The four become one. A single tween so they arrive together — staggering the
        // collapse would read as four separate exits rather than as one convergence.
        .to(lines, { y: (i: number) => offsets[i], duration: 1, ease: "expo.out" }, ">0.45")
        .to(lines, { opacity: 0, duration: 0.5, ease: "power2.out" }, "<0.35")
        .to(
          unified,
          { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out" },
          "<0.1",
        )
        .to(rule, { scaleX: 1, duration: 0.8, ease: "power3.out" }, "<0.15");
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative isolate flex min-h-[85vh] items-center bg-surface px-6 py-[16vh] md:px-[6vw] min-[900px]:py-[12vh]"
    >
      <div className="grid w-full gap-14 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:items-center min-[900px]:gap-[6vw]">
        <div className="flex flex-col gap-5">
          <p
            data-about-head
            className="m-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-ink-muted"
          >
            Section 02 — Who we are
          </p>
          <h2
            data-about-head
            className="m-0 text-[clamp(2rem,5.2vw,4rem)] font-semibold leading-none tracking-[-0.04em] text-ink"
          >
            Four crafts.
            <br />
            One studio.
          </h2>
          <p
            data-about-head
            className="m-0 max-w-[34ch] text-[0.9375rem] leading-[1.75] text-ink-muted"
          >
            Technology creates functionality. Design creates emotion. The best brands need
            both.
          </p>
          <p
            data-about-head
            className="m-0 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-muted"
          >
            A creative studio in {STUDIO_LOCATION}
          </p>
        </div>

        <div className="relative">
          {/* The list as every agency prints it — four services, four lines. */}
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {CRAFTS.map((craft) => (
              <li
                key={craft}
                data-about-craft
                className="m-0 text-[clamp(1.15rem,2.6vw,1.9rem)] font-semibold leading-[1.25] tracking-[-0.03em] text-ink-muted will-change-transform"
              >
                {craft}
              </li>
            ))}
          </ul>

          {/* What they resolve into, parked on the baseline the four collapse onto. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-center gap-3">
            <p
              data-about-unified
              className="text-gradient m-0 text-[clamp(1.6rem,4vw,2.9rem)] font-semibold leading-[1.1] tracking-[-0.035em]"
            >
              One experience.
            </p>
            <span
              data-about-rule
              aria-hidden="true"
              className="block h-px w-[min(20ch,100%)] bg-[image:var(--gradient-accent)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
