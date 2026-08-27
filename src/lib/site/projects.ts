/**
 * The work, grouped by discipline.
 *
 * Single source of truth for Chapter 6. The three disciplines are the same three the navbar
 * points at — a test locks the two lists together so they cannot drift — and each chapter
 * gives one project the full frame and lets the rest support it. That is the brand's own
 * portfolio philosophy: a few exceptional projects are worth more than many average ones.
 *
 * ⚠ EVERY PROJECT BELOW IS A PLACEHOLDER. The names are "Project N", the photographs are
 * stock, and no result is measurable. The composition is built to carry real work and will
 * not flatter what is here. Replacing this array is the highest-value change available to
 * this section — nothing about the layout will fix it.
 */

export type Discipline = "web" | "video" | "graphics";

export type DisciplineMeta = {
  id: Discipline;
  /** What the navbar calls it, and what the chapter is headed with. */
  label: string;
  /** The pillar verb — Build, Capture, Move — carried as the chapter's label. */
  verb: string;
  claim: string;
};

/** Order is the running order on the page, and matches NAV_LINKS. */
export const DISCIPLINES: readonly DisciplineMeta[] = [
  {
    id: "web",
    label: "Web",
    verb: "Build",
    claim: "Fast, modern, high-performance digital experiences.",
  },
  {
    id: "video",
    label: "Video",
    verb: "Move",
    claim: "Stories that connect emotionally.",
  },
  {
    id: "graphics",
    label: "Design",
    verb: "Capture",
    claim: "Visual identities that communicate personality and quality.",
  },
];

/** The four beats brand-guidelines.md requires of every project, in the order it lists them. */
export const REQUIRED_BEATS = ["Challenge", "Process", "Solution", "Result"] as const;

export type BeatLabel = (typeof REQUIRED_BEATS)[number];

export type ProjectBeat = {
  label: BeatLabel;
  value: string;
};

export type ProjectMedia =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; alt?: undefined };

type BaseProject = {
  slug: string;
  discipline: Discipline;
  sector: string;
  name: string;
  media: ProjectMedia;
};

/** The one project per chapter that gets a whole frame, and therefore all four beats. */
export type LeadProject = BaseProject & {
  lead: true;
  /** The line the frame is held on. */
  headline: string;
  beats: readonly [ProjectBeat, ProjectBeat, ProjectBeat, ProjectBeat];
};

/** Everything else, shown compactly. One line is all the room it gets, so one line is all it needs. */
export type SupportingProject = BaseProject & {
  lead?: false;
  summary: string;
};

export type Project = LeadProject | SupportingProject;

const beats = (
  challenge: string,
  process: string,
  solution: string,
  result: string,
): LeadProject["beats"] => [
  { label: "Challenge", value: challenge },
  { label: "Process", value: process },
  { label: "Solution", value: solution },
  { label: "Result", value: result },
];

export const PROJECTS: readonly Project[] = [
  {
    slug: "project-one",
    discipline: "web",
    lead: true,
    sector: "Hospitality",
    name: "Project One",
    headline: "Three properties,\none system.",
    beats: beats(
      "A boutique group whose three properties shared nothing but a parent name.",
      "One identity settled first, then the builds — never the other way round.",
      "A single design system carrying three distinct property characters.",
      "One presence across every guest touchpoint.",
    ),
    // Unsplash License (unsplash.com/photo-1758193783649-13371d7fb8dd)
    media: {
      kind: "image",
      src: "/images/proof-project-one-hotel.jpg",
      alt: "Elegant boutique hotel lobby interior",
    },
  },
  {
    slug: "project-three",
    discipline: "web",
    sector: "Internal tooling",
    name: "Project Three",
    summary: "A build system the team could actually ship against.",
    // Photo by Bernd Dittrich, Unsplash License (unsplash.com/photo-1774901128215-3549cc686921)
    media: {
      kind: "image",
      src: "/images/build-code-workspace.jpg",
      alt: "Dark-themed code editor displaying a web project on a laptop screen",
    },
  },
  {
    slug: "project-two",
    discipline: "video",
    lead: true,
    sector: "Product launch",
    name: "Project Two",
    headline: "One launch,\none story.",
    beats: beats(
      "Strong technology with no visual story to match it.",
      "Brand stills, launch film and the site made from one creative direction.",
      "A single campaign running across web, video and print.",
      "A launch that read as one story, not three deliverables.",
    ),
    // Video by Trev W. Adams, Pexels License (pexels.com/video/night-traffic-in-city-13567267).
    // 15MB — must be re-encoded before production. It is the heaviest asset on the site.
    media: { kind: "video", src: "/videos/move-city-night.mp4" },
  },
  {
    slug: "project-four",
    discipline: "graphics",
    lead: true,
    sector: "Editorial",
    name: "Project Four",
    headline: "A face,\nnot a logo.",
    beats: beats(
      "A studio recognised by its work but not by its name.",
      "Portraiture and type developed together rather than briefed apart.",
      "An identity built on photography instead of a mark.",
      "A look that survives being cropped, printed and reposted.",
    ),
    // Unsplash License (unsplash.com/photo-1506863530036-1efeddceb993)
    media: {
      kind: "image",
      src: "/images/capture-portrait.jpg",
      alt: "Black-and-white editorial studio portrait",
    },
  },
  {
    slug: "project-five",
    discipline: "graphics",
    sector: "Architecture",
    name: "Project Five",
    summary: "A visual language drawn from the buildings themselves.",
    // Unsplash License (unsplash.com/photo-1758846946191-dfe1cd91779b)
    media: {
      kind: "image",
      src: "/images/proof-project-two-architecture.jpg",
      alt: "Modern glass building facade reflecting the sky",
    },
  },
];

export function projectsFor(discipline: Discipline): Project[] {
  return PROJECTS.filter((project) => project.discipline === discipline);
}

export function leadProject(discipline: Discipline): LeadProject | undefined {
  return projectsFor(discipline).find((project): project is LeadProject => project.lead === true);
}

export function supportingProjects(discipline: Discipline): SupportingProject[] {
  return projectsFor(discipline).filter(
    (project): project is SupportingProject => project.lead !== true,
  );
}

/** Every discipline has its own index page listing the whole category. */
export function workHref(discipline: Discipline): string {
  return `/work/${discipline}`;
}

/**
 * The single line a project is listed with. Leads carry four beats and supporting projects
 * carry one summary, so the index needs one way to ask either of them for a sentence — and
 * a lead's Result is the beat that belongs in a list.
 */
export function projectLine(project: Project): string {
  if (project.lead === true) {
    return project.beats.find((beat) => beat.label === "Result")?.value ?? "";
  }
  return project.summary;
}
