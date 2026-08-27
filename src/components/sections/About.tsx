"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { FIELD_COUNT, fieldPosition } from "@/lib/motion/overlap";
import { STUDIO_LOCATION } from "@/lib/site/studio";
import { SectionEyebrow } from "@/components/SectionEyebrow";

/**
 * Chapter 3 — Our Philosophy. The hero already commits to three disciplines and one studio,
 * so this section takes the part the hero leaves unsaid: *why* they are one. Three fields —
 * the site, the film, the identity — drift together until they intersect, and the payoff
 * sits where all three are true at once. The studio's position is made spatial rather than
 * claimed.
 *
 * Held in place with CSS `sticky` rather than a GSAP pin. No section on the page pins now —
 * sticky holds a section just as well without taking it out of flow, and costs nothing when
 * ScrollTrigger refreshes.
 *
 * Arrival and the gather are two triggers on purpose. A held section's scrub does not begin
 * until its top reaches the top of the viewport — a full screen after the content is already
 * visible — so running the reveal off the scrub leaves the section blank the whole way in.
 */
/**
 * Additive primaries, which is the one colour model that argues the same thing this section
 * does: red, green and blue are how every screen makes every other colour, so three fields
 * combining is the claim rather than a decoration of it. Video takes red for the record
 * light.
 *
 * Shades, not primaries — raspberry, jade and azure rather than #f00/#0f0/#00f, which would
 * read as a test card. This is a deliberate departure from the one-accent rule in
 * design-principles.md: the accent gradient still owns every hairline and every piece of
 * accented type on the page, and these three are material for one section only.
 *
 * Carried as bare channels rather than finished colours so the core and halo stops can be
 * written directly instead of patched out of each other with string replacement.
 */
const FIELDS = [
  { label: "Websites", rgb: "74, 114, 245" },
  { label: "Videos", rgb: "228, 80, 110" },
  { label: "Designs", rgb: "45, 190, 126" },
] as const;

/**
 * Alphas are capped by what the payoff line needs to survive. Multiplying three fields at
 * 0.35 each puts the intersection near rgb(129, 139, 161), which holds ink at about 5.3:1;
 * at the 0.5 the earlier tints used, saturated primaries would take it far darker and the
 * ink would start to fail on the one word the section exists to deliver.
 */
const FIELD_CORE_ALPHA = 0.42;
const FIELD_HALO_ALPHA = 0.2;

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
      data-eyebrow-surface
      className="relative isolate bg-surface motion-safe:min-[900px]:h-[190vh]"
    >
      <div className="flex flex-col gap-[7vh] px-6 py-[16vh] md:px-[6vw] motion-safe:min-[900px]:sticky motion-safe:min-[900px]:top-0 motion-safe:min-[900px]:h-screen motion-safe:min-[900px]:justify-center motion-safe:min-[900px]:py-0">
        <div className="flex flex-col gap-4">
          <span data-about-lead className="block">
            <SectionEyebrow index="02" label="Who we are" />
          </span>
          <span
            data-about-rule
            aria-hidden="true"
            className="block h-px w-full origin-left bg-[image:var(--gradient-accent)]"
          />
        </div>

        {/* The stage. Fields sit behind the type in their own layer so the multiply blend
            darkens the ground and never the words. */}
        <div className="relative min-h-[72vh] min-[900px]:min-h-[64vh]">
          {/* No z-index here on purpose. A positioned element with an explicit z-index
              forms a stacking context, and a stacking context is an isolation boundary for
              blending — the fields would multiply with each other but not with the surface
              they sit on. Paint order comes from the content's z-10 instead. */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            {FIELDS.map((field) => (
              <span
                key={field.label}
                data-about-field
                className="absolute left-1/2 top-1/2 block aspect-square w-[58%] min-w-[340px] mix-blend-multiply will-change-transform"
                style={{
                  // A radial falloff, not a circle. There is no edge to read, which is what
                  // keeps three overlapping fields from reading as a Venn diagram.
                  backgroundImage: `radial-gradient(circle at 50% 50%, rgba(${field.rgb}, ${FIELD_CORE_ALPHA}) 0%, rgba(${field.rgb}, ${FIELD_HALO_ALPHA}) 42%, transparent 72%)`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex h-full flex-col justify-center gap-6">
            <p
              data-about-setup
              className="m-0 max-w-[26ch] text-[clamp(1.0625rem,2.4vw,1.5rem)] font-medium leading-[1.35] tracking-[-0.025em] text-ink-muted"
            >
              What you need rarely fits one job description.
            </p>

            {/* Ink, not the gradient. The fields darken the ground beneath these words by an
                amount that depends on how far the gather has run, and the accent ramp is
                only guaranteed legible down to --color-panel. */}
            <p
              data-about-payoff
              className="m-0 max-w-[12ch] text-[clamp(2.75rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-ink will-change-transform"
            >
              The answer lives in the overlap.
            </p>

            <div className="flex flex-col gap-3">
              <p className="m-0 max-w-[38ch] text-[0.9375rem] leading-[1.75] text-ink-muted">
                Hire three specialists and you get three answers — plus the job of making
                them agree. Nobody quotes for that job. It lands on you.
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
