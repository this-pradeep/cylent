import { clampProgress } from "@/lib/motion/scroll-progress";

/** A card starts entering when its top is this far down the viewport. */
const ENTRANCE_LEAD_FRACTION = 0.88;
/** How much scroll, as a fraction of the viewport, the entrance takes. */
const ENTRANCE_SPAN_FRACTION = 0.46;

/** Arrived past the midpoint of its own entrance… */
const FRONT_MIN_ARRIVAL = 0.55;
/** …and not yet meaningfully overlapped by the next card. */
const FRONT_MAX_COVERED = 0.25;

const RISE_FRACTION = 0.09;
const MIN_SCALE = 0.97;
const COVER_SCALE_DROP = 0.018;
const MIN_OPACITY = 0.2;
const BODY_FADE_WHEN_COVERED = 0.72;

/** One lean per draft, alternating, so the settled pile reads as paper rather than as UI. */
export const CARD_TILTS_DEG: readonly number[] = [-0.75, 0.55, -0.35];

/**
 * Below this the cards stop stacking and become a plain vertical sequence.
 * `globals.css` gates the sticky rules on the same value — keep the two in step.
 */
export const STACK_BREAKPOINT_PX = 820;

export type CardTransform = {
  /** Vertical offset in px; the card rises to 0 as it lands. */
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  /** Applied to the card's inner body so covered cards recede. */
  bodyOpacity: number;
};

/**
 * How far a card has travelled through its entrance, 0 before it starts and 1 once landed.
 * Derived from the card's own flow offset so each card is independent of the others.
 */
export function arrivalProgress(
  scrollTop: number,
  cardOffsetTop: number,
  viewportHeight: number,
): number {
  const start = cardOffsetTop - viewportHeight * ENTRANCE_LEAD_FRACTION;
  const span = viewportHeight * ENTRANCE_SPAN_FRACTION;
  if (span <= 0) return 0;
  return clampProgress((scrollTop - start) / span);
}

/**
 * Whether this card is the one the pointer should reach. The thresholds are disjoint across a
 * monotonically non-increasing stack, so at most one card is ever front — otherwise the peeking
 * strips of buried cards would trigger a reveal nobody can see.
 */
export function isFrontCard(arrival: number, covered: number): boolean {
  return arrival > FRONT_MIN_ARRIVAL && covered < FRONT_MAX_COVERED;
}

/**
 * Compositor-only values for a card at a given point in its entrance.
 * `covered` is the *next* card's arrival progress.
 */
export function cardTransform(
  arrival: number,
  covered: number,
  tiltDeg: number,
  viewportHeight: number,
): CardTransform {
  const remaining = 1 - arrival;
  return {
    y: remaining * viewportHeight * RISE_FRACTION,
    rotate: tiltDeg * remaining,
    scale: MIN_SCALE + (1 - MIN_SCALE) * arrival - covered * COVER_SCALE_DROP,
    opacity: clampProgress(MIN_OPACITY + (1 - MIN_OPACITY) * arrival),
    bodyOpacity: 1 - BODY_FADE_WHEN_COVERED * covered,
  };
}
