"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ImageAsset } from "@/components/ImageAsset";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { VideoAsset } from "@/components/VideoAsset";
import { beatWindow } from "@/lib/motion/chapter-beats";
import {
  DISCIPLINES,
  type LeadProject,
  type SupportingProject,
  leadProject,
  supportingProjects,
} from "@/lib/site/projects";

/**
 * Chapter 6 — the work, one chapter per discipline.
 *
 * Absorbs what the Pillars section used to do. Pillars presented web, video and design as a
 * pinned horizontal triad and this section then presented projects; the same three
 * disciplines appeared twice, once claimed and once evidenced. They are now one thing: each
 * discipline heads its own chapter and proves itself with the work underneath it, which is
 * also why the navbar's ids live here now.
 *
 * Each chapter gives exactly one project a full frame — the brand's portfolio philosophy is
 * a few exceptional projects over many average ones — and the rest a single line. The four
 * beats the brand guidelines require arrive over the lead's lower edge as it is scrolled
 * through.
 *
 * Grounds alternate on purpose: masthead and supporting strip on surface, lead frame dark.
 * Three dark full-bleed frames running back to back would collapse into one long dark
 * stretch and lose the rhythm the design principles ask for.
 *
 * The frames hold with CSS `sticky` rather than a GSAP pin. Nothing on the page pins any
 * more, and sticky is what made that possible: it holds a frame without taking the element
 * out of flow, costs nothing at refresh time, and cannot fight a neighbour the way two pins
 * across a section boundary can.
 */
function LeadFrame({ project, priority }: { project: LeadProject; priority: boolean }) {
  return (
    <div className="relative flex h-svh min-h-[560px] flex-col justify-end overflow-hidden bg-ink motion-safe:min-[820px]:sticky motion-safe:min-[820px]:top-0 motion-safe:min-[820px]:h-screen">
      <div data-chapter-plate className="absolute inset-0 motion-safe:min-[820px]:-inset-y-[4%]">
        {project.media.kind === "video" ? (
          <VideoAsset src={project.media.src} aspectRatio="fill" />
        ) : (
          <ImageAsset
            src={project.media.src}
            alt={project.media.alt}
            aspectRatio="fill"
            priority={priority}
          />
        )}
      </div>

      {/* Two layers, both derived rather than eyeballed, because white type over a
          photograph nobody has chosen yet has to hold against the worst case: a blown white
          highlight sitting exactly under a word.

          The flat grade carries the headline. Composite luminance is roughly 1 - alpha, and
          3:1 for display type needs it at or under 0.286, so nothing below 0.72 works at
          all; 0.78 lands it at 3.6:1. The gradient then carries the lower edge to about
          7.9:1 at the bottom and 5:1 at the first beat, which is where a 0.72-only version
          failed — the gradient had faded to 0.35 while the text was still 15px.

          If the real photography comes in dark, the flat layer is the dial to drop. */}
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
            {project.name} · {project.sector}
          </p>
          <h4
            data-chapter-lead
            className="m-0 max-w-[13ch] whitespace-pre-line text-[clamp(2rem,5.6vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-surface"
          >
            {project.headline}
          </h4>
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
              <dd className="m-0 text-[0.9375rem] leading-[1.55] text-surface/95">{beat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function SupportingRow({ projects }: { projects: SupportingProject[] }) {
  if (projects.length === 0) return null;

  return (
    <ul className="m-0 grid list-none gap-8 px-6 py-[9vh] md:px-[6vw] min-[720px]:grid-cols-2 min-[720px]:gap-[4vw]">
      {projects.map((project) => (
        <li key={project.slug} data-chapter-support className="m-0 flex flex-col gap-4">
          {project.media.kind === "video" ? (
            <VideoAsset src={project.media.src} aspectRatio="16:9" />
          ) : (
            <ImageAsset src={project.media.src} alt={project.media.alt} aspectRatio="16:9" />
          )}
          <div className="flex flex-col gap-1.5">
            <p className="m-0 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink-muted">
              {project.name} · {project.sector}
            </p>
            <p className="m-0 text-[1.0625rem] font-semibold leading-[1.3] tracking-[-0.02em] text-ink">
              {project.summary}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Work() {
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
          masthead: Array.from(chapter.querySelectorAll<HTMLElement>("[data-chapter-masthead]")),
          lead: Array.from(chapter.querySelectorAll<HTMLElement>("[data-chapter-lead]")),
          beats: Array.from(chapter.querySelectorAll<HTMLElement>("[data-chapter-beat]")),
          support: Array.from(chapter.querySelectorAll<HTMLElement>("[data-chapter-support]")),
        }));

        // With motion removed every beat is simply present. None of this is decorative — the
        // four beats are required content.
        if (still) {
          parts.forEach(({ masthead, lead, beats, support }) => {
            gsap.set([...masthead, ...lead, ...beats, ...support], {
              opacity: 1,
              y: 0,
              clipPath: "none",
            });
          });
          return;
        }

        const timelines = parts.flatMap(({ chapter, masthead, lead, beats, support }) => {
          const reveal = (targets: HTMLElement[], start: string) =>
            gsap.timeline({
              defaults: { ease: "power3.out" },
              scrollTrigger: { trigger: targets[0], start, toggleActions: "play none none reverse" },
            }).fromTo(
              targets,
              { clipPath: "inset(0% 0% 100% 0%)", y: 20 },
              { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.8, stagger: 0.1 },
              0,
            );

          const built = [reveal(masthead, "top 84%"), reveal(lead, "top 78%")];
          if (support.length > 0) built.push(reveal(support, "top 82%"));

          // A total duration of 1 maps this timeline straight onto the scrub, so the windows
          // in chapter-beats.ts are the timeline's own positions with no conversion.
          const gather = gsap.timeline({
            scrollTrigger: {
              trigger: chapter.querySelector("[data-chapter-frame]"),
              start: held ? "top top" : "top 70%",
              end: held ? "bottom bottom" : "bottom 70%",
              scrub: 0.85,
            },
          });

          // The frame drifts across the hold — 6%, inside the motion system's 5-20% parallax
          // band. It runs the full length even where it moves nothing, which is what fixes
          // the timeline at a duration of 1 on viewports that do not hold.
          const plate = chapter.querySelector("[data-chapter-plate]");
          const drift = held ? 3 : 0;
          if (plate) {
            gather.fromTo(plate, { yPercent: -drift }, { yPercent: drift, duration: 1, ease: "none" }, 0);
          }

          beats.forEach((beat, index) => {
            const window = beatWindow(index, beats.length);
            if (!window) return;
            gather.fromTo(
              beat,
              { opacity: 0, y: 18 },
              { opacity: 1, y: 0, duration: window.end - window.start, ease: "power3.out" },
              window.start,
            );
          });

          built.push(gather);
          return built;
        });

        return () => {
          timelines.forEach((timeline) => timeline.scrollTrigger?.kill());
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-surface">
      {DISCIPLINES.map((discipline, disciplineIndex) => {
        const lead = leadProject(discipline.id);
        if (!lead) return null;

        return (
          <article
            key={discipline.id}
            id={discipline.id}
            data-chapter
            data-eyebrow-surface
            className="relative"
          >
            <header className="flex flex-col gap-4 px-6 py-[11vh] md:px-[6vw]">
              <span data-chapter-masthead className="block">
                <SectionEyebrow index={`0${disciplineIndex + 1}`} label={discipline.label} />
              </span>
              <h3
                data-chapter-masthead
                className="m-0 text-[clamp(2.25rem,6vw,4.75rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-ink"
              >
                {discipline.verb}
              </h3>
              <p
                data-chapter-masthead
                className="m-0 max-w-[34ch] text-[0.9375rem] leading-[1.75] text-ink-muted"
              >
                {discipline.claim}
              </p>
            </header>

            {/* The hold is the lead frame's own scroll room. 170vh rather than the 230vh a
                single chapter could afford — three chapters share the page now. */}
            <div data-chapter-frame className="relative motion-safe:min-[820px]:h-[170vh]">
              <LeadFrame project={lead} priority={disciplineIndex === 0} />
            </div>

            <SupportingRow projects={supportingProjects(discipline.id)} />
          </article>
        );
      })}
    </section>
  );
}
