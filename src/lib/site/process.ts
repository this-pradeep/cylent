/**
 * Chapter 7 — The Process.
 *
 * `website-story.md` flagged the Confidence beat — "they know how to execute" — as
 * unclaimed once Chapters 5 and 7 were cut. This is the content that claims it back.
 *
 * The stages are the four in `docs/ux_architecture.md` (ACT 07), moved off the engineering
 * register: this studio makes websites, film and identity, so "Engineer" and "Deploy" are
 * Build and Deliver.
 *
 * ⚠ THE WORDS BELOW ARE A PROPOSAL. The four stage names are settled; the heading, the
 * subhead and the four supporting lines are marketing copy and belong to the studio. They
 * are written here so the section is never shipped empty, and nothing in the layout depends
 * on them — every one of these strings can be replaced without touching a component.
 */

export type ProcessStage = {
  /** Shown as a typographic element. The <ol> carries the order; this is composition. */
  number: string;
  name: string;
  /** One line. What actually happens here — never a claim about how well it happens. */
  line: string;
};

export const PROCESS_EYEBROW = "How we work";

/**
 * Grammatically unlike Chapter 3's payoff on purpose. That one is a third-person claim
 * about the work ("Great work doesn't happen in silos"); this is first-person and about
 * the studio. Two display headings built the same way, two sections apart, read as one
 * sentence said twice.
 */
export const PROCESS_HEADING = "We work the same way every time.";

/** The line that stops the heading reading as rigidity rather than as rigour. */
export const PROCESS_SUBHEAD = "The work changes. The method doesn’t.";

export const PROCESS_STAGES: readonly ProcessStage[] = [
  {
    number: "01",
    name: "Discover",
    line: "We find out what it’s actually for.",
  },
  {
    number: "02",
    name: "Design",
    line: "We argue the idea before anything gets built.",
  },
  {
    number: "03",
    name: "Build",
    line: "We make it — written, shot, or drawn.",
  },
  {
    number: "04",
    name: "Deliver",
    line: "We hand it over working, not almost working.",
  },
];
