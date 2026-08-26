import { clampProgress } from "@/lib/motion/scroll-progress";

/**
 * The absorption: four crafts most agencies print as a service list, each consumed into the
 * one above it until a single line is left. Chapter 3 of the story argues that development,
 * video, photography and design are one experience rather than four departments — this is
 * that argument as motion.
 *
 * Absorbing beats converging here. Lines that travel to a shared baseline pass through each
 * other and land as unreadable overlap; a line consumed the moment it meets the one above
 * never collides, and the count is legible the whole way down.
 *
 * Everything below is expressed against the scrub's 0–1 progress so the visitor drives the
 * sequence, and so the geometry can be reasoned about without a DOM.
 */

/** The lines have all arrived by here; nothing is consumed before it. */
export const ENTRY_END = 0.28;
/** The last absorption completes here, leaving one line to resolve over the remainder. */
export const ABSORB_END = 0.82;

export type ConsumeWindow = {
  start: number;
  end: number;
};

/** How many lines get absorbed: all of them but the one the others become. */
export function absorptionCount(count: number): number {
  return count > 1 ? count - 1 : 0;
}

/**
 * When a given line is consumed, as a slice of the scrub.
 *
 * Bottom-up, one at a time, with windows that touch but never overlap — the list shortens
 * from its end and the counter has an unambiguous moment to tick on. Returns null for the
 * first line, which is never absorbed, and for indices outside the stack.
 */
export function consumeWindow(index: number, count: number): ConsumeWindow | null {
  const absorptions = absorptionCount(count);
  if (absorptions === 0) return null;
  if (index < 1 || index > count - 1) return null;

  const span = (ABSORB_END - ENTRY_END) / absorptions;
  // The bottom line goes first, so order is the reverse of index.
  const order = count - 1 - index;
  const start = ENTRY_END + order * span;
  return { start, end: start + span };
}

/**
 * How many crafts are still standing — the numeral the counter shows.
 *
 * Ticks on the *end* of each window rather than its start: the count should change when a
 * line is gone, not while it is still visibly leaving.
 */
export function remainingAt(progress: number, count: number): number {
  const absorptions = absorptionCount(count);
  if (absorptions === 0) return Math.max(count, 1);

  const p = clampProgress(progress);
  if (p <= ENTRY_END) return count;
  if (p >= ABSORB_END) return 1;

  const span = (ABSORB_END - ENTRY_END) / absorptions;
  const consumed = Math.floor((p - ENTRY_END) / span);
  return count - Math.min(consumed, absorptions);
}
