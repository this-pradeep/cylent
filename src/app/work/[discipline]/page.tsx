import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkHero } from "@/components/WorkHero";
import { WorkList } from "@/components/WorkList";
import { Arrow } from "@/components/icons/Arrow";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, graph } from "@/lib/site/schema";
import { pageMetadata } from "@/lib/site/seo";
import {
  DISCIPLINES,
  type Discipline,
  type DisciplineMeta,
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

  return pageMetadata({
    title: discipline.label,
    description: discipline.claim,
    path: `/work/${discipline.id}`,
  });
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
      {/* The trail a search result can show above this page. Two levels, because the
          disciplines sit directly under the homepage — there is no /work index to name. */}
      <JsonLd
        schema={graph([
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: discipline.label },
          ]),
        ])}
      />

      <WorkHero discipline={discipline} />

      <WorkList projects={projects} />

      <div className="px-6 pb-[16vh] pt-[12vh] md:px-[6vw]">
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
