import { clampProgress } from "@/lib/motion/scroll-progress";

/**
 * The overlap. Three fields — the site, the film, the identity — drift together until they
 * intersect, and the payoff line sits where all three are true at once. Chapter 3 of the
 * story argues that the disciplines are one experience rather than three services; this
 * makes the studio's position spatial instead of merely stated.
 *
 * Positions are percentages of a field's own box — the unit GSAP's `xPercent`/`yPercent`
 * take — so the geometry holds at any viewport and can be reasoned about without a DOM.
 * A field is sized at 46% of the stage, so 100 here is 46% of the stage's width.
 */

export type FieldPosition = {
  x: number;
  y: number;
};

export const FIELD_COUNT = 3;

/**
 * Where the fields sit before the gather. Deliberately lopsided: an even triangle of three
 * circles is a Venn diagram, and a Venn diagram is a consultancy slide.
 */
export const FIELD_RESTS: readonly FieldPosition[] = [
  { x: -62, y: -34 },
  { x: 40, y: 46 },
  { x: 78, y: -44 },
];

/**
 * Where they gather — around the payoff line rather than around each other, so the
 * intersection arrives at the words instead of the words being dropped into a diagram.
 *
 * Not one point. Three fields landing on top of each other are one field, and the overlap
 * is the entire argument, so each keeps a residual offset.
 */
export const FIELD_FOCUS: readonly FieldPosition[] = [
  { x: -18, y: -10 },
  { x: 4, y: 16 },
  { x: 22, y: -18 },
];

const ORIGIN: FieldPosition = { x: 0, y: 0 };

/** Where a field sits at a given point in the gather. */
export function fieldPosition(index: number, progress: number): FieldPosition {
  const rest = FIELD_RESTS[index];
  const focus = FIELD_FOCUS[index];
  if (!rest || !focus) return { ...ORIGIN };

  const p = clampProgress(progress);
  return {
    x: rest.x + (focus.x - rest.x) * p,
    y: rest.y + (focus.y - rest.y) * p,
  };
}

/**
 * The widest gap between any two fields. Used to reason about whether they still intersect:
 * a spread wider than a field's radius leaves three separate pools and nothing to sit in.
 */
export function fieldSpread(progress: number): number {
  const positions = Array.from({ length: FIELD_COUNT }, (_, index) =>
    fieldPosition(index, progress),
  );

  let widest = 0;
  for (let a = 0; a < positions.length; a += 1) {
    for (let b = a + 1; b < positions.length; b += 1) {
      const dx = positions[a].x - positions[b].x;
      const dy = positions[a].y - positions[b].y;
      widest = Math.max(widest, Math.hypot(dx, dy));
    }
  }
  return widest;
}
