"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { FIELD_COUNT, fieldPosition } from "@/lib/motion/overlap";
import { STUDIO_LOCATION } from "@/lib/site/studio";

/**
 * Chapter 3 — Our Philosophy. The hero already commits to three disciplines and one studio,
 * so this section takes the part the hero leaves unsaid: *why* they are one. Three fields —
 * the site, the film, the identity — drift together until they intersect, and the payoff
 * sits where all three are true at once. The studio's position is made spatial rather than
 * claimed.
 *
 * Held in place with CSS `sticky` rather than a GSAP pin: Pillars pins a full-screen track
 * immediately after, and a second pin competing across that boundary on every refresh is a
 * known source of jitter.
 *
 * Arrival and the gather are two triggers on purpose. A held section's scrub does not begin
 * until its top reaches the top of the viewport — a full screen after the content is already
 * visible — so running the reveal off the scrub leaves the section blank the whole way in.
 */
const FIELDS = [
  { label: "Websites", tint: "rgba(169, 59, 157, 0.5)" },
  { label: "Videos", tint: "rgba(104, 83, 212, 0.5)" },
  { label: "Designs", tint: "rgba(8, 115, 127, 0.5)" },
] as const;

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const query = <T extends HTMLElement>(selector: string) => section.querySelector<T>(selector);
    const queryAll = <T extends HTMLElement>(selector: string) =>
      Array.from(section.querySelectorAll<T>(selector));

    const lead = queryAll("[data-about-lead]");
    const rule = query("[data-about-rule]");
    const fields = queryAll("[data-about-field]");
    const labels = queryAll("[data-about-label]");
    const setup = query("[data-about-setup]");
    const payoff = query("[data-about-payoff]");
    if (!rule || !setup || !payoff || fields.length !== FIELD_COUNT) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        held: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
        flowing: "(max-width: 899px) and (prefers-reduced-motion: no-preference)",
        still: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { held, still } = context.conditions as Record<string, boolean>;

        const place = (progress: number) => {
          fields.forEach((field, index) => {
            const { x, y } = fieldPosition(index, progress);
            // The -50 is the centring. It has to live here rather than in a Tailwind
            // translate utility, because GSAP writes `transform` wholesale and would
            // clobber a class-based translate the first time it placed a field.
            gsap.set(field, { xPercent: -50 + x, yPercent: -50 + y });
          });
        };

        // With motion removed the drift has nothing to show, so the fields are placed where
        // they end up and the section states its conclusion outright.
        if (still) {
          gsap.set([...lead, setup, payoff], { clipPath: "none", y: 0, opacity: 1 });
          gsap.set(rule, { scaleX: 1 });
          gsap.set(fields, { opacity: 1, scale: 1 });
          gsap.set(labels, { opacity: 0 });
          place(1);
          return;
        }

        place(0);

        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          })
          .fromTo(
            lead,
            { clipPath: "inset(0% 0% 100% 0%)", y: 16 },
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.75, stagger: 0.09 },
            0,
          )
          .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.95 }, 0.1)
          // The fields bloom rather than slide in — they are light, not objects.
          .fromTo(
            fields,
            { opacity: 0, scale: 0.82 },
            { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out", stagger: 0.12 },
            0.15,
          )
          .fromTo(
            [setup, ...labels],
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 },
            0.4,
          );

        const gather = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: held ? "top top" : "top 62%",
            end: held ? "bottom bottom" : "bottom 65%",
            scrub: 0.9,
            invalidateOnRefresh: true,
            // Driven off the scrub's own progress rather than tweened per field: the
            // geometry is one table in overlap.ts, and this keeps it the only description
            // of where a field is.
            onUpdate: (self) => place(self.progress),
          },
        });

        gather
          // The labels name three things. They go before the payoff lands, because by then
          // there are not three things any more.
          .to(labels, { opacity: 0, duration: 0.3, stagger: 0.06 }, 0.18)
          .to(setup, { opacity: 0.28, duration: 0.3 }, 0.3)
          .fromTo(
            payoff,
            { clipPath: "inset(0% 0% 100% 0%)", y: 22 },
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.34, ease: "expo.out" },
            0.62,
          );

        return () => {
          gather.scrollTrigger?.kill();
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
      <div className="flex flex-col gap-[7vh] px-6 py-[16vh] md:px-[6vw] motion-safe:min-[900px]:sticky motion-safe:min-[900px]:top-0 motion-safe:min-[900px]:h-screen motion-safe:min-[900px]:justify-center motion-safe:min-[900px]:py-0">
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

        {/* The stage. Fields sit behind the type in their own layer so the multiply blend
            darkens the ground and never the words. */}
        <div className="relative min-h-[58vh] min-[900px]:min-h-[52vh]">
          {/* No z-index here on purpose. A positioned element with an explicit z-index
              forms a stacking context, and a stacking context is an isolation boundary for
              blending — the fields would multiply with each other but not with the surface
              they sit on. Paint order comes from the content's z-10 instead. */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            {FIELDS.map((field) => (
              <span
                key={field.label}
                data-about-field
                className="absolute left-1/2 top-1/2 block aspect-square w-[46%] min-w-[280px] mix-blend-multiply will-change-transform"
                style={{
                  // A radial falloff, not a circle. There is no edge to read, which is what
                  // keeps three overlapping fields from reading as a Venn diagram.
                  backgroundImage: `radial-gradient(circle at 50% 50%, ${field.tint} 0%, ${field.tint.replace("0.5", "0.22")} 42%, transparent 72%)`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex h-full flex-col justify-center gap-6">
            <p
              data-about-setup
              className="m-0 max-w-[24ch] text-[clamp(1rem,2.1vw,1.3rem)] font-medium leading-[1.4] tracking-[-0.02em] text-ink-muted"
            >
              Most studios sell you a slice.
            </p>

            {/* Ink, not the gradient. The fields darken the ground beneath these words by an
                amount that depends on how far the gather has run, and the accent ramp is
                only guaranteed legible down to --color-panel. */}
            <p
              data-about-payoff
              className="m-0 max-w-[13ch] text-[clamp(2.25rem,7vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-ink will-change-transform"
            >
              We work in the overlap.
            </p>

            <div className="flex flex-col gap-3">
              <p className="m-0 max-w-[38ch] text-[0.9375rem] leading-[1.75] text-ink-muted">
                The site, the film and the identity are the same decision made three ways.
                Split them across three vendors and they stop agreeing.
              </p>
              <p
                data-about-lead
                className="m-0 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-muted"
              >
                A creative studio in {STUDIO_LOCATION}
              </p>
            </div>
          </div>

          {/* Named at the outer edge of each field, as annotations rather than set labels
              printed inside circles. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 hidden min-[900px]:block">
            <span data-about-label className="absolute left-[6%] top-[12%] font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
              Websites
            </span>
            <span data-about-label className="absolute bottom-[10%] left-[46%] font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
              Videos
            </span>
            <span data-about-label className="absolute right-[6%] top-[8%] font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink-muted">
              Designs
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
