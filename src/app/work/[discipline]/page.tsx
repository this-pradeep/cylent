import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageAsset } from "@/components/ImageAsset";
import { VideoAsset } from "@/components/VideoAsset";
import { SectionEyebrow, EYEBROW_LIFT_HEADROOM } from "@/components/SectionEyebrow";
import { Arrow } from "@/components/icons/Arrow";
import {
  DISCIPLINES,
  type Discipline,
  type DisciplineMeta,
  projectLine,
  projectsFor,
} from "@/lib/site/projects";

type PageProps = {
  params: Promise<{ discipline: string }>;
};

/** The export is static, so every route has to be known at build time. */
export function generateStaticParams() {
  return DISCIPLINES.map((discipline) => ({ discipline: discipline.id }));
}

function findDiscipline(id: string): DisciplineMeta | undefined {
  return DISCIPLINES.find((discipline) => discipline.id === (id as Discipline));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { discipline: id } = await params;
  const discipline = findDiscipline(id);
  if (!discipline) return {};

  return {
    title: `${discipline.label} — Cylent Solutions`,
    description: discipline.claim,
  };
}

/**
 * Every project in one discipline.
 *
 * Rows alternate sides rather than sitting in a grid. Chapter 6 rules out endless project
 * grids and generic case study cards, and that applies to an index as much as to the
 * homepage — with two or three projects a grid would also read as a mostly-empty shelf.
 */
export default async function DisciplineWorkPage({ params }: PageProps) {
  const { discipline: id } = await params;
  const discipline = findDiscipline(id);
  if (!discipline) notFound();

  const projects = projectsFor(discipline.id);

  return (
    <main data-eyebrow-surface className="bg-surface">
      <header className="flex flex-col gap-6 px-6 pb-[9vh] pt-[22vh] md:px-[6vw]">
        <span className={`block ${EYEBROW_LIFT_HEADROOM}`}>
          <SectionEyebrow label={discipline.verb} />
        </span>
        <h1 className="m-0 text-[clamp(2.5rem,8vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-ink">
          {discipline.label}
        </h1>
        <p className="m-0 max-w-[38ch] text-[0.9375rem] leading-[1.75] text-ink-muted">
          {discipline.claim}
        </p>
        <span aria-hidden="true" className="mt-2 block h-px w-full bg-[image:var(--gradient-accent)]" />
      </header>

      <ol className="m-0 flex list-none flex-col gap-[12vh] p-0 px-6 pb-[14vh] md:px-[6vw]">
        {projects.map((project, index) => (
          <li
            key={project.slug}
            className={`m-0 flex flex-col gap-7 min-[900px]:items-center min-[900px]:gap-[5vw] ${
              index % 2 === 0 ? "min-[900px]:flex-row" : "min-[900px]:flex-row-reverse"
            }`}
          >
            <div className="min-[900px]:w-[58%]">
              {project.media.kind === "video" ? (
                <VideoAsset src={project.media.src} aspectRatio="16:9" />
              ) : (
                <ImageAsset
                  src={project.media.src}
                  alt={project.media.alt}
                  aspectRatio="16:9"
                  priority={index === 0}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 min-[900px]:w-[42%]">
              <p className="m-0 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink-muted">
                {project.sector}
              </p>
              <p className="m-0 text-[clamp(1.25rem,2.6vw,1.75rem)] font-semibold leading-[1.25] tracking-[-0.03em] text-ink">
                {projectLine(project)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="px-6 pb-[16vh] md:px-[6vw]">
        <Link
          href={`/#${discipline.id}`}
          className="group inline-flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
        >
          <Arrow className="h-3.5 w-3.5 rotate-[-135deg]" />
          Back to the studio
        </Link>
      </div>
    </main>
  );
}
