import { clampProgress } from "@/lib/motion/scroll-progress";

/**
 * Chapter 7 — The Process. One hairline is drawn across the section as it is scrolled, and
 * the four stages are stations on it. This is where the front is and when each station
 * lights.
 *
 * The two are not tuned against each other. A station's reveal begins at the scrub progress
 * where `drawExtent` reaches that station's own position, so "the station lights as the line
 * reaches it" is arithmetic rather than a pair of sequences that happen to agree. Change
 * either constant below and they stay in step.
 *
 * Expressed against the scrub's 0–1 progress, like `chapter-beats.ts`, so the sequencing can
 * be reasoned about without a DOM.
 *
 * Deliberately not `beatWindow` from that module. It divides a scrub into equal consecutive
 * slices for items that have no position of their own; these stations have positions on a
 * line and their timing is derived from those positions. One function cannot mean both
 * things without lying about what its numbers are.
 */

/** The section holds before the stroke starts, so the heading is read first. */
export const DRAW_LEAD = 0.08;

/** The stroke is complete by here, leaving scroll to rest on the finished diagram. */
export const DRAW_END = 0.82;

/** How long one station takes to arrive, as a slice of the scrub. */
export const STATION_REVEAL = 0.1;

export type StationReveal = {
  start: number;
  end: number;
};

/**
 * Where a station sits along the line, 0–1.
 *
 * `index / count`, not `index / (count - 1)`: the stations sit at the head of their own
 * columns rather than being spread to both ends. That is what the desktop grid does — four
 * equal columns, each station at its column's left edge — so the geometry here is the
 * layout's, not an approximation of it. It also leaves a quarter of the stroke running on
 * past the last station, which is the section's closing image: the work goes out and keeps
 * going.
 */
export function stationPosition(index: number, count: number): number | null {
  if (count <= 0 || index < 0 || index > count - 1) return null;
  return index / count;
}

/** How much of the line is drawn at this point in the scrub, 0–1. */
export function drawExtent(progress: number): number {
  return clampProgress((progress - DRAW_LEAD) / (DRAW_END - DRAW_LEAD));
}

/** When a station arrives — starting at the moment the drawing front reaches it. */
export function stationReveal(index: number, count: number): StationReveal | null {
  const position = stationPosition(index, count);
  if (position === null) return null;

  const start = DRAW_LEAD + position * (DRAW_END - DRAW_LEAD);
  return { start, end: start + STATION_REVEAL };
}
