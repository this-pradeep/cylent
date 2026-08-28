"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  FIELD_COUNT,
  FIELD_FALLOFF_PERCENT,
  fieldPosition,
} from "@/lib/motion/overlap";
import { STUDIO_LOCATION } from "@/lib/site/studio";
import {
  EYEBROW_LIFT_HEADROOM,
  SectionEyebrow,
} from "@/components/SectionEyebrow";

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
 * Vivid rather than tinted. Multiplied over a warm paper ground these read as stained glass
 * — saturated where a single field owns the space, deepening where two or three cross. The
 * earlier muted shades were doing neither job: too weak to be a colour, too flat to be
 * glass.
 *
 * This is a deliberate departure from the one-accent rule in design-principles.md. The
 * accent gradient still owns every hairline and every piece of accented type on the page;
 * these three are material for one section only.
 */
const FIELDS = [
  { label: "Websites", rgb: "76, 111, 255" },
  { label: "Videos", rgb: "255, 78, 122" },
  { label: "Designs", rgb: "31, 217, 160" },
] as const;

/**
 * Five stops rather than three. A radial gradient with few stops bands visibly once it is
 * this large, and the banding is what makes a wash look printed instead of lit.
 *
 * The core alpha is capped by what the payoff line needs. Three fields multiplying at 0.30
 * each put the intersection near rgb(145, 156, 185), which holds ink at about 6.8:1; the
 * ceiling before ink starts to fail is a long way above that, but the cores are already as
 * saturated as glass wants to be.
 */
const FIELD_STOPS: readonly { at: number; alpha: number }[] = [
  { at: 0, alpha: 0.62 },
  { at: 26, alpha: 0.4 },
  { at: 52, alpha: 0.18 },
  { at: 74, alpha: 0.05 },
  { at: FIELD_FALLOFF_PERCENT, alpha: 0 },
];

function fieldGradient(rgb: string): string {
  const stops = FIELD_STOPS.map(
    ({ at, alpha }) => `rgba(${rgb}, ${alpha}) ${at}%`,
  ).join(", ");
  return `radial-gradient(circle at 50% 50%, ${stops})`;
}

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const query = <T extends HTMLElement>(selector: string) =>
      section.querySelector<T>(selector);
    const queryAll = <T extends HTMLElement>(selector: string) =>
      Array.from(section.querySelectorAll<T>(selector));

    const lead = queryAll("[data-about-lead]");
    const rule = query("[data-about-rule]");
    const fields = queryAll("[data-about-field]");
    const labels = queryAll("[data-about-label]");
    const stanza = queryAll("[data-about-stanza]");
    const payoff = query("[data-about-payoff]");
    if (!rule || !payoff || stanza.length === 0 || fields.length !== FIELD_COUNT) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        held: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
        flowing:
          "(max-width: 899px) and (prefers-reduced-motion: no-preference)",
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
          gsap.set([...lead, ...stanza, payoff], {
            clipPath: "none",
            y: 0,
            opacity: 1,
          });
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
            {
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              duration: 0.75,
              stagger: 0.09,
            },
            0,
          )
          .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.95 }, 0.1)
          // The fields bloom rather than slide in — they are light, not objects.
          .fromTo(
            fields,
            { opacity: 0, scale: 0.82 },
            {
              opacity: 1,
              scale: 1,
              duration: 1.1,
              ease: "power2.out",
              stagger: 0.12,
            },
            0.15,
          )
          .fromTo(
            labels,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 },
            0.4,
          )
          // The headline belongs to the arrival, not to the scrub. Revealing it two thirds
          // of the way through the gather left the section reading as an unfinished page
          // for most of the time it was on screen.
          .fromTo(
            payoff,
            { clipPath: "inset(0% 0% 100% 0%)", y: 24 },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              duration: 0.95,
              ease: "expo.out",
            },
            0.5,
          )
          // The stanza follows the headline rather than preceding it, because it is the
          // headline's own elaboration — three lines that each start where the last one
          // left off, and a turn at the end. Staggered so it arrives in reading order.
          .fromTo(
            stanza,
            { clipPath: "inset(0% 0% 100% 0%)", y: 14 },
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.7, stagger: 0.11 },
            1.05,
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

        // The labels name three things. They go as the fields close, because by the time the
        // fields have gathered there are not three things any more.
        gather.to(labels, { opacity: 0, duration: 0.34, stagger: 0.06 }, 0.3);

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
      {/* The wrapper paints its own ground, and that is load-bearing. `position: sticky`
          creates a stacking context, which is an isolation boundary for blending — without
          a background of its own here the fields would have nothing to multiply against and
          would composite as flat washes instead of glass. */}
      <div className="relative flex flex-col gap-[7vh] overflow-hidden bg-surface px-6 py-[16vh] md:px-[6vw] motion-safe:min-[900px]:sticky motion-safe:min-[900px]:top-0 motion-safe:min-[900px]:h-screen motion-safe:min-[900px]:justify-center motion-safe:min-[900px]:py-0">
        {/* Full bleed, behind everything. No z-index: an explicit one would form a second
            stacking context and isolate the blend all over again. Paint order comes from the
            content carrying z-10. */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          {FIELDS.map((field) => (
            <span
              key={field.label}
              data-about-field
              className="absolute left-1/2 top-1/2 block aspect-square w-[78%] min-w-[520px] mix-blend-multiply will-change-transform"
              style={{
                // A falloff, not a circle. There is no edge to read, which is what keeps
                // three overlapping fields from reading as a Venn diagram.
                backgroundImage: fieldGradient(field.rgb),
              }}
            />
          ))}
        </div>

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

        <div className="relative z-10 flex flex-col gap-7">
          {/* Ink, not the gradient. The fields darken the ground beneath these words by an
              amount that depends on how far the gather has run, and the accent ramp is only
              guaranteed legible down to --color-panel. */}
          <p
            data-about-payoff
            className="m-0 max-w-[13ch] text-[clamp(2.75rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-ink will-change-transform"
          >
            Great work doesn&rsquo;t happen in silos.
          </p>

          {/* Four lines, set as one stanza. The three &ldquo;between&rdquo; lines are a
              cadence — each is a fragment of the sentence above it, so they are set at one
              size in one weight and separated only by their own line breaks. The turn at the
              end takes full ink, because it is the only one of the four that is a claim. */}
          <div className="flex max-w-[52ch] flex-col gap-1.5">
            <p
              data-about-stanza
              className="m-0 text-[clamp(1.0625rem,2.2vw,1.375rem)] font-medium leading-[1.35] tracking-[-0.02em] text-ink/70"
            >
              It happens in the space between ideas and execution.
            </p>
            <p
              data-about-stanza
              className="m-0 text-[clamp(1.0625rem,2.2vw,1.375rem)] font-medium leading-[1.35] tracking-[-0.02em] text-ink/70"
            >
              Between technology and design.
            </p>
            <p
              data-about-stanza
              className="m-0 text-[clamp(1.0625rem,2.2vw,1.375rem)] font-medium leading-[1.35] tracking-[-0.02em] text-ink/70"
            >
              Between strategy and storytelling.
            </p>
            <p
              data-about-stanza
              className="m-0 mt-2 text-[clamp(1.0625rem,2.2vw,1.375rem)] font-semibold leading-[1.35] tracking-[-0.025em] text-ink"
            >
              That&rsquo;s where we work.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="m-0 max-w-[44ch] text-[1rem] font-medium leading-[1.7] text-ink">
              We bring different disciplines together to create digital experiences, brands,
              and stories that feel as good as they work.
            </p>
            {/* The place is read from `studio.ts` rather than typed here. It is stamped
                beside the loader's clock as well, and two copies of somewhere we might move
                is two chances to be wrong about it. */}
            <p
              data-about-lead
              className="m-0 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink"
            >
              Cylent &mdash; a creative technology studio from {STUDIO_LOCATION}
            </p>
          </div>
        </div>

        {/* Named at the outer edge of each field, as annotations rather than set labels
            printed inside circles. Kept clear of the copy column on the left. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 hidden min-[900px]:block"
        >
          <span
            data-about-label
            // Right of the copy column, not above it. At left-[6%] this sat in the same
            // place as the eyebrow — which only became a collision once the copy grew tall
            // enough to push the eyebrow up the centred column.
            className="absolute left-[52%] top-[11%] font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink"
          >
            Websites
          </span>
          <span
            data-about-label
            className="absolute right-[8%] top-[24%] font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink"
          >
            Videos
          </span>
          <span
            data-about-label
            className="absolute bottom-[16%] right-[10%] font-mono text-[0.625rem] uppercase tracking-[0.2em] text-ink"
          >
            Designs
          </span>
        </div>
      </div>
    </section>
  );
}
