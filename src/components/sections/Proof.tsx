"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ImageAsset } from "@/components/ImageAsset";
import { beatWindow } from "@/lib/motion/chapter-beats";

/**
 * Chapter 6 — Proof. Each project takes a whole frame, edge to edge, and the four beats the
 * brand guidelines require — challenge, process, solution, result — arrive over the lower
 * edge as you scroll through it. The story document rules out generic case study cards and
 * asks the work to feel curated; a screen per project is what curated looks like, and beats
 * that arrive in sequence stop being the list that made it a card.
 *
 * NOTE: the names and photographs here are still placeholders, and the results are claims
 * rather than outcomes. The composition is built to carry real work — it will not flatter
 * stock.
 */
type Beat = {
  label: string;
  value: string;
};

type Project = {
  index: string;
  sector: string;
  name: string;
  /** The line the frame is held on, drawn from the project's own solution. */
  headline: string;
  beats: Beat[];
  image: { src: string; alt: string };
};

const PROJECTS: Project[] = [
  {
    index: "01",
    sector: "Hospitality",
    name: "Project One",
    headline: "Three properties,\none system.",
    beats: [
      { label: "Challenge", value: "A boutique group whose three properties shared nothing but a parent name." },
      { label: "Process", value: "One identity settled first, then the builds — never the other way round." },
      { label: "Solution", value: "A single design system carrying three distinct property characters." },
      { label: "Result", value: "One presence across every guest touchpoint." },
    ],
    // Unsplash License (unsplash.com/photo-1758193783649-13371d7fb8dd)
    image: { src: "/images/proof-project-one-hotel.jpg", alt: "Elegant boutique hotel lobby interior" },
  },
  {
    index: "02",
    sector: "Product launch",
    name: "Project Two",
    headline: "One launch,\none story.",
    beats: [
      { label: "Challenge", value: "Strong technology with no visual story to match it." },
      { label: "Process", value: "Brand stills, launch film and the site made from one creative direction." },
      { label: "Solution", value: "A single campaign running across web, video and print." },
      { label: "Result", value: "A launch that read as one story, not three deliverables." },
    ],
    // Unsplash License (unsplash.com/photo-1758846946191-dfe1cd91779b)
    image: { src: "/images/proof-project-two-architecture.jpg", alt: "Modern glass building facade reflecting the sky" },
  },
];

export function Proof() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const chapters = Array.from(section.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (chapters.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        held: "(min-width: 820px) and (prefers-reduced-motion: no-preference)",
        flowing: "(max-width: 819px) and (prefers-reduced-motion: no-preference)",
        still: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { held, still } = context.conditions as Record<string, boolean>;

        const parts = chapters.map((chapter) => ({
          chapter,
          lead: Array.from(chapter.querySelectorAll<HTMLElement>("[data-chapter-lead]")),
          beats: Array.from(chapter.querySelectorAll<HTMLElement>("[data-chapter-beat]")),
        }));

        // With motion removed every beat is simply present. Nothing here is decorative, so
        // nothing can be dropped — the four beats are required content.
        if (still) {
          parts.forEach(({ lead, beats }) => {
            gsap.set([...lead, ...beats], { opacity: 1, y: 0, clipPath: "none" });
          });
          return;
        }

        const triggers = parts.map(({ chapter, lead, beats }) => {
          const entry = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: chapter,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          });
          entry.fromTo(
            lead,
            { clipPath: "inset(0% 0% 100% 0%)", y: 20 },
            { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.85, stagger: 0.1 },
            0,
          );

          // A total duration of 1 maps this timeline straight onto the scrub, so the windows
          // in chapter-beats.ts are the timeline's own positions with no conversion.
          const gather = gsap.timeline({
            scrollTrigger: {
              trigger: chapter,
              start: held ? "top top" : "top 70%",
              end: held ? "bottom bottom" : "bottom 70%",
              scrub: 0.85,
            },
          });

          // The frame drifts through the chapter rather than sitting dead still — 6% across
          // the whole hold, inside the motion system's 5–20% parallax band. It also runs the
          // full length even when it moves nothing, which is what fixes the timeline at a
          // duration of 1 on viewports that do not hold.
          const plate = chapter.querySelector("[data-chapter-plate]");
          const drift = held ? 3 : 0;
          if (plate) {
            gather.fromTo(
              plate,
              { yPercent: -drift },
              { yPercent: drift, duration: 1, ease: "none" },
              0,
            );
          }

          beats.forEach((beat, index) => {
            const window = beatWindow(index, beats.length);
            if (!window) return;
            gather.fromTo(
              beat,
              { opacity: 0, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: window.end - window.start,
                ease: "power3.out",
              },
              window.start,
            );
          });

          return [entry, gather];
        });

        return () => {
          triggers.flat().forEach((timeline) => timeline.scrollTrigger?.kill());
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-ink">
      {PROJECTS.map((project, projectIndex) => (
        <article
          key={project.name}
          data-chapter
          className="relative motion-safe:min-[820px]:h-[230vh]"
        >
          <div className="relative flex h-svh min-h-[560px] flex-col justify-end overflow-hidden motion-safe:min-[820px]:sticky motion-safe:min-[820px]:top-0 motion-safe:min-[820px]:h-screen">
            <div data-chapter-plate className="absolute inset-0 motion-safe:min-[820px]:-inset-y-[4%]">
              <ImageAsset
                src={project.image.src}
                alt={project.image.alt}
                aspectRatio="fill"
                priority={projectIndex === 0}
              />
            </div>

            {/* Two layers, both derived rather than eyeballed, because white type over a
                photograph nobody has chosen yet has to hold against the worst case: a blown
                white highlight sitting exactly under a word.

                The flat grade is what carries the headline. Composite luminance is roughly
                1 - alpha, and 3:1 for display type needs it at or under 0.286, so nothing
                below 0.72 works at all; 0.78 lands it at 3.6:1 with a little room. The
                gradient then carries the lower edge to about 7.9:1 at the very bottom and
                5:1 at the top of the beats, which is where the first pass failed — the
                gradient had faded to 0.35 by the time it reached the first beat while the
                text was still 15px.

                This is why the frame is graded so far down. If the real photography comes in
                dark, the flat layer is the dial to drop. */}
            <div aria-hidden="true" className="absolute inset-0 bg-ink/[0.78]" />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(to_top,rgba(20,18,15,0.68)_0%,rgba(20,18,15,0.42)_38%,transparent_100%)]"
            />

            <div className="relative flex flex-col gap-8 px-6 pb-[9vh] md:px-[6vw] min-[820px]:flex-row min-[820px]:items-end min-[820px]:justify-between min-[820px]:gap-[6vw]">
              <div className="flex flex-col gap-4">
                <p
                  data-chapter-lead
                  className="m-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-surface/70"
                >
                  {project.index} — {project.sector}
                </p>
                <h3
                  data-chapter-lead
                  className="m-0 max-w-[13ch] whitespace-pre-line text-[clamp(2rem,5.6vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-surface"
                >
                  {project.headline}
                </h3>
              </div>

              <dl className="m-0 flex max-w-[42ch] flex-col gap-4 min-[820px]:max-w-[34ch]">
                {project.beats.map((beat) => (
                  <div
                    key={beat.label}
                    data-chapter-beat
                    className="flex flex-col gap-1 border-l border-surface/25 pl-4 will-change-transform"
                  >
                    <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-surface/60">
                      {beat.label}
                    </dt>
                    <dd className="m-0 text-[0.9375rem] leading-[1.55] text-surface/95">
                      {beat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
