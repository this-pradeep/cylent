import { describe, expect, it } from "vitest";
import { BEATS_END, BEAT_LEAD, beatWindow } from "@/lib/motion/chapter-beats";

const BEATS = 4;

describe("beatWindow", () => {
  it("holds the frame alone before the first beat arrives", () => {
    expect(beatWindow(0, BEATS)!.start).toBeCloseTo(BEAT_LEAD, 5);
    expect(BEAT_LEAD).toBeGreaterThan(0);
  });

  it("lands the last beat with scroll still left to hold on it", () => {
    expect(beatWindow(BEATS - 1, BEATS)!.end).toBeCloseTo(BEATS_END, 5);
    expect(BEATS_END).toBeLessThan(1);
  });

  it("reveals in reading order", () => {
    const starts = [0, 1, 2, 3].map((index) => beatWindow(index, BEATS)!.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("gives every beat an equal share of the reveal", () => {
    const spans = [0, 1, 2, 3].map((index) => {
      const window = beatWindow(index, BEATS)!;
      return window.end - window.start;
    });
    spans.forEach((span) => expect(span).toBeCloseTo(spans[0], 5));
  });

  it("hands off without gaps or overlap", () => {
    for (let index = 0; index < BEATS - 1; index += 1) {
      expect(beatWindow(index, BEATS)!.end).toBeCloseTo(beatWindow(index + 1, BEATS)!.start, 5);
    }
  });

  it("has no window for a beat outside the set", () => {
    expect(beatWindow(BEATS, BEATS)).toBeNull();
    expect(beatWindow(-1, BEATS)).toBeNull();
    expect(beatWindow(0, 0)).toBeNull();
  });
});
