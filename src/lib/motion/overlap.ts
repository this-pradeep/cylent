import { clampProgress } from "@/lib/motion/scroll-progress";

/**
 * The overlap. Three fields — the site, the film, the identity — drift together until they
 * intersect, and the payoff line sits where all three are true at once. Chapter 3 of the
 * story argues that the disciplines are one experience rather than three services; this
 * makes the studio's position spatial instead of merely stated.
 *
 * Positions are percentages of a field's own box — the unit GSAP's `xPercent`/`yPercent`
 * take — so the geometry holds at any viewport and can be reasoned about without a DOM.
 * A field is sized at 58% of the stage, so 100 here is 58% of the stage's width.
 *
 * That size is why the offsets look modest. The composition is self-similar — grow the
 * fields and the same offsets fling them further across the stage in absolute terms — so
 * making the section grander meant scaling these down, not up, to keep the arrangement on
 * stage rather than half of it clipped against the edges.
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
  { x: -45, y: -25 },
  { x: 29, y: 33 },
  { x: 56, y: -32 },
];

/**
 * Where they gather — around the payoff line rather than around each other, so the
 * intersection arrives at the words instead of the words being dropped into a diagram.
 *
 * Not one point. Three fields landing on top of each other are one field, and the overlap
 * is the entire argument, so each keeps a residual offset.
 */
export const FIELD_FOCUS: readonly FieldPosition[] = [
  { x: -13, y: -7 },
  { x: 3, y: 12 },
  { x: 16, y: -13 },
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
