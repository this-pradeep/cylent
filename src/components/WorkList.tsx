"use client";

import { CircularButton } from "@/components/CircularButton";
import { ProjectMediaView } from "@/components/ProjectMediaView";
import { type Project, projectLine } from "@/lib/site/projects";
import { WorkRowLight } from "@/components/WorkRowLight";

/**
 * The card as an analysis.
 *
 * It explains the work rather than displaying it: the four beats the brand guidelines
 * require of every project, set as an apparatus beside the artefact. Chapter 6 asks for
 * proof, and proof of thinking is worth more than proof of output.
 *
 * ## Three things this deliberately does not do
 *
 * **No mono eyebrow chips.** Small uppercase mono at wide tracking is the default costume of
 * every agency template, and four of them stacked down a column read as furniture rather
 * than as writing. The beat labels are run-in headings instead — set in the text face, in
 * the text size, distinguished by weight and colour and followed by a full stop, the way a
 * printed reference work has done it for four hundred years. The label starts the sentence
 * rather than sitting in a box above it.
 *
 * **No rules standing in for punctuation.** A hairline between a client and a sector is a
 * dash pretending to be design. The two are simply set on their own lines, with weight doing
 * the separating.
 *
 * **No dimension ornament.** The measuring rules went with the numbering: once nothing is
 * being counted or pointed at, a drawing that mimes measurement is decoration claiming to be
 * technical.
 *
 * ## The artefact
 *
 * It bleeds off the side of the page. Nothing floats, because the frame has no outer edge on
 * one side — the screen supplies it — and `design-principles.md` asks for the grid to be
 * broken intentionally, which is what an image running past the margin is. Sides alternate
 * so a long list has a rhythm rather than a repeated pattern.
 *
 * ## The ground
 *
 * The section does not change colour to separate itself from the page. Each project brings
 * its own light instead — see `WorkRowLight` — so the separation is the colour of the work
 * rather than a band drawn behind it. A flat panel was tried first and read wrong: it comes
 * from the paper family, warm and beige, sitting directly under a hero made of cool
 * dispersed light. Two temperatures arguing across one join.
 *
 * The hairlines top and bottom stay, because the light falls away at the row's ends and
 * something has to say where the section begins.
 */

function domainOf(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function annotationsFor(project: Project): { label: string; value: string }[] {
  if (project.lead === true) return project.beats.map((beat) => ({ ...beat }));
  return [{ label: "Summary", value: project.summary }];
}

export function WorkList({ projects }: { projects: Project[] }) {
  return (
    // The ground is painted here and that is load-bearing: a multiplying layer with no
    // ground beneath it composites as a flat wash instead of as light.
    <div className="relative overflow-hidden border-y border-ink/15 bg-surface">
      {/* No horizontal padding on the list. The artefact reaches the screen edge because
          there is nothing between it and the edge — not because a negative margin is
          cancelling something. The text column carries the page margin instead. */}
      <ol className="relative m-0 flex list-none flex-col gap-[20vh] p-0 py-[14vh]">
        {projects.map((project, index) => {
          const notes = annotationsFor(project);
          const bleedLeft = index % 2 === 0;

          return (
            <li
              key={project.slug}
              // The wrapper paints nothing, but it does have to be positioned: the fields
              // pin to it, and `relative` on the content below is what puts the content in
              // front of them without an explicit z-index isolating the blend.
              className={`relative m-0 flex flex-col gap-10 min-[900px]:items-center min-[900px]:gap-[4vw] ${
                bleedLeft ? "min-[900px]:flex-row" : "min-[900px]:flex-row-reverse"
              }`}
            >
              <WorkRowLight
                discipline={project.discipline}
                index={index}
                bleedLeft={bleedLeft}
              />
              {/* Flush to the screen edge on its own side. */}
              <div className="relative min-[900px]:w-[58%] min-[900px]:shrink-0">
                <ProjectMediaView media={project.media} aspectRatio="16:9" priority={index === 0} />
              </div>

              <div
                className={`relative flex flex-col gap-7 px-6 md:px-[6vw] min-[900px]:w-[42%] ${
                  bleedLeft
                    ? "min-[900px]:pl-[4vw] min-[900px]:pr-[6vw]"
                    : "min-[900px]:pl-[6vw] min-[900px]:pr-[4vw]"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="m-0 w-fit text-[1.0625rem] font-semibold leading-[1.3] tracking-[-0.02em] text-ink">
                    {project.client ?? project.sector}
                    {/* The accent as a rule under the words, which is a use the brand
                        guidelines sanction — and the only ornament left on the card. */}
                    <span
                      aria-hidden="true"
                      className="mt-1.5 block h-px w-full bg-[image:var(--gradient-accent)]"
                    />
                  </h3>
                  {project.client ? (
                    <p className="m-0 text-[0.9375rem] leading-[1.4] text-ink/50">{project.sector}</p>
                  ) : null}
                </div>

                <p className="m-0 text-[clamp(1.5rem,2.9vw,2.125rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-ink">
                  {projectLine(project)}
                </p>

                {/* Run-in headings. The label opens the sentence rather than labelling a box. */}
                <dl className="m-0 flex flex-col gap-3.5">
                  {notes.map((note) => (
                    <div key={note.label} className="text-[0.9375rem] leading-[1.6] text-ink/85">
                      <dt className="inline font-semibold text-ink">{note.label}.</dt>{" "}
                      <dd className="m-0 inline">{note.value}</dd>
                    </div>
                  ))}
                </dl>

                {project.url ? (
                  <div className="mt-2">
                    {/* The footer's button, at a smaller size, and carrying the domain rather
                        than a verb — so a page of these never spins the same words twice. */}
                    <CircularButton
                      label={domainOf(project.url)}
                      ariaLabel={`Visit ${domainOf(project.url)}`}
                      href={project.url}
                      external
                      size={116}
                      repeats={2}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
