/**
 * Chapter 6 — Proof. Each project holds a full frame while its four beats arrive over the
 * lower edge one at a time. The story document rules out generic case study cards, and a
 * four-item list is a card no matter how it is styled; arriving in sequence, the same four
 * beats read as a story being told rather than a specification being filed.
 *
 * Expressed against the scrub's 0–1 progress so the visitor sets the pace, and so the
 * sequencing can be reasoned about without a DOM.
 */

/** The frame holds alone for this much of the scroll before the first beat lands. */
export const BEAT_LEAD = 0.22;
/** The last beat is in by here, leaving scroll to rest on the finished frame. */
export const BEATS_END = 0.86;

export type BeatWindow = {
  start: number;
  end: number;
};

/** When a beat arrives, as a slice of the scrub. Reading order, evenly divided. */
export function beatWindow(index: number, count: number): BeatWindow | null {
  if (count <= 0 || index < 0 || index > count - 1) return null;

  const span = (BEATS_END - BEAT_LEAD) / count;
  const start = BEAT_LEAD + index * span;
  return { start, end: start + span };
}

