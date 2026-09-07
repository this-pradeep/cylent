/**
 * The work, grouped by discipline.
 *
 * Single source of truth for Chapter 6. The three disciplines are the same three the navbar
 * points at — a test locks the two lists together so they cannot drift — and each chapter
 * gives one project the full frame and lets the rest support it. That is the brand's own
 * portfolio philosophy: a few exceptional projects are worth more than many average ones.
 *
 * ⚠ TWO OF THE FOUR PROJECTS BELOW ARE STILL PLACEHOLDERS. `product-launch` and
 * `editorial-identity` carry stock photography and results nobody measured; the composition
 * is built to carry real work and will not flatter what is there. Replacing them is the
 * highest-value change available to this section — nothing about the layout will fix it.
 *
 * `zen-data-shastra` and `aurea-dental` are real: real builds, real screenshots, live URLs.
 * Aurea is self-initiated and says so in its sector, because a concept presented as an
 * engagement is the one kind of portfolio entry that costs more than it earns.
 *
 * There is no `name` and nothing is numbered. The placeholders had been "Project One",
 * "Two" and "Four", which is a sequence with a hole in it and read as a mistake rather than
 * as a stand-in. A real client name belongs here when there is one; a counter never did.
 *
 * The supporting shape is kept even though nothing is currently supporting. Each discipline
 * is meant to grow past one project, and the lead-plus-rest split is what stops the section
 * costing three full screens when it does.
 */

export type Discipline = "web" | "video" | "graphics";

export type DisciplineMeta = {
  id: Discipline;
  /** What the navbar calls it, and what the chapter is headed with. */
  label: string;
  /**
   * The eyebrow above the chapter's heading.
   *
   * It was the bare pillar verb — Build, Move, Capture — which stopped working once the
   * heading became the discipline. "Capture" over "Design" is the pillar the story document
   * pairs with photography sitting above the word for something else, and the pairing read
   * as a mismatch rather than as a pair.
   *
   * All three now take one shape, because the shape is what makes them a set: read down the
   * page they are three promises in the same grammar, and each one says something its
   * heading does not already say.
   */
  promise: string;
  claim: string;
};

/** Order is the running order on the page, and matches NAV_LINKS. */
export const DISCIPLINES: readonly DisciplineMeta[] = [
  {
    id: "web",
    label: "Web",
    promise: "Built to perform",
    claim: "Fast, modern, high-performance digital experiences.",
  },
  {
    id: "video",
    label: "Video",
    promise: "Built to move",
    claim: "Stories that connect emotionally.",
  },
  {
    id: "graphics",
    label: "Design",
    promise: "Built to be recognised",
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
  | {
      kind: "image";
      src: string;
      alt: string;
      /**
       * "cover" for a photograph, which can be cropped to fill a frame. "contain" for a
       * product shot, which cannot — cropping a device mockup cuts the device. It also
       * decides how the lead frame is composed: a contained shot sits on the ink ground
       * with the type beside it, where a photograph is graded and carries the type on top.
       */
      fit?: "cover" | "contain";
    }
  | { kind: "video"; src: string; alt?: undefined; fit?: undefined }
  /** A third-party player. Always contained — it has its own controls and its own branding. */
  | { kind: "embed"; src: string; title: string; alt?: undefined; fit?: undefined };

type BaseProject = {
  slug: string;
  discipline: Discipline;
  /** What kind of work it was. */
  sector: string;
  /** Who it was for. Present once there is a real client to name — never a placeholder. */
  client?: string;
  /** The live site, where there is one to link to. */
  url?: string;
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

/**
 * Slugs describe the work rather than counting it — they are React keys and future route
 * segments, and a key called "project-four" tells nobody anything.
 */

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
    slug: "zen-data-shastra",
    discipline: "web",
    lead: true,
    client: "Zen Data Shastra",
    sector: "AI & analytics",
    url: "https://zendatashastra.com/",
    headline: "One proposition,\nevery screen.",
    // ⚠ These four are mine and grounded only in what the finished site shows. The Result in
    // particular is a fact, not an outcome — replace it with something the engagement
    // actually produced.
    beats: beats(
      "A consultancy with real delivery behind it and nothing online that said so.",
      "The proposition settled first — the objection the client's buyers actually voice — then the site built around it.",
      "A responsive marketing site that opens on that objection instead of on a capability list.",
      "Live at zendatashastra.com.",
    ),
    media: {
      kind: "image",
      src: "/images/zen-data-shastra.webp",
      alt: "The Zen Data Shastra website shown on a desktop, laptop, tablet and phone",
      fit: "contain",
    },
  },
  {
    slug: "aurea-dental",
    discipline: "web",
    /**
     * Self-initiated, so there is no client and the sector says so outright rather than
     * leaving a reader to assume one. The studio, the dentists and the address on the site
     * are invented for the concept; naming any of them here would put a client on the
     * portfolio that does not exist.
     */
    sector: "Dental — concept",
    url: "https://dental-clinic-iota-eight-65.vercel.app",
    summary: "A dental studio in Zürich, treated like an editorial brand rather than a clinic.",
    media: {
      kind: "image",
      src: "/images/aurea-dental.webp",
      alt: "The Aurea dental studio concept site shown on a desktop, laptop, tablet and phone",
      // A device mockup, so it is shown whole. Cropping it to fill would cut the devices.
      fit: "contain",
    },
  },
  {
    slug: "product-launch",
    discipline: "video",
    lead: true,
    sector: "Product launch",
    headline: "One launch,\none story.",
    beats: beats(
      "Strong technology with no visual story to match it.",
      "Brand stills, launch film and the site made from one creative direction.",
      "A single campaign running across web, video and print.",
      "A launch that read as one story, not three deliverables.",
    ),
    media: {
      kind: "embed",
      src: "https://player.cloudinary.com/embed/?cloud_name=gdzpcyo9&public_id=calling_all_units",
      title: "Product launch film",
    },
  },
  {
    slug: "editorial-identity",
    discipline: "graphics",
    lead: true,
    sector: "Editorial",
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

/**
 * Whether the media is shown whole rather than bled to the edges.
 *
 * A photograph can be cropped to fill a frame and graded so type sits over it. A product
 * shot cannot be cropped without cutting the device, so it is shown whole on the ground with
 * the type kept clear of it.
 *
 * A player is not contained. Stripped of its own interface it behaves like footage, and
 * footage covers — see BackgroundEmbed.
 *
 * Lives here so every surface that renders a project agrees about it.
 */
export function isContained(media: ProjectMedia): boolean {
  return media.kind === "image" && media.fit === "contain";
}
