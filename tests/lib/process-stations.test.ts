import { describe, expect, it } from "vitest";
import {
  DRAW_END,
  DRAW_LEAD,
  STATION_REVEAL,
  drawExtent,
  stationPosition,
  stationReveal,
} from "@/lib/motion/process-stations";

const STAGES = 4;

describe("drawExtent", () => {
  it("holds the line closed until the lead is spent", () => {
    expect(drawExtent(0)).toBe(0);
    expect(drawExtent(DRAW_LEAD)).toBeCloseTo(0, 5);
  });

  it("completes the line with scroll left to rest on it", () => {
    expect(drawExtent(DRAW_END)).toBeCloseTo(1, 5);
    expect(DRAW_END).toBeLessThan(1);
  });

  it("never runs past either end", () => {
    expect(drawExtent(-0.5)).toBe(0);
    expect(drawExtent(1.5)).toBe(1);
  });

  it("draws in one direction only", () => {
    const samples = [0, 0.1, 0.25, 0.4, 0.6, 0.75, 0.9, 1].map(drawExtent);
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });
});

describe("stationPosition", () => {
  it("puts the stations at the head of their own columns", () => {
    expect(stationPosition(0, STAGES)).toBeCloseTo(0, 5);
    expect(stationPosition(1, STAGES)).toBeCloseTo(0.25, 5);
    expect(stationPosition(2, STAGES)).toBeCloseTo(0.5, 5);
    expect(stationPosition(3, STAGES)).toBeCloseTo(0.75, 5);
  });

  it("leaves line beyond the last station, so the stroke carries on past it", () => {
    expect(stationPosition(STAGES - 1, STAGES)).toBeLessThan(1);
  });

  it("has no position for a station outside the set", () => {
    expect(stationPosition(STAGES, STAGES)).toBeNull();
    expect(stationPosition(-1, STAGES)).toBeNull();
    expect(stationPosition(0, 0)).toBeNull();
  });
});

describe("stationReveal", () => {
  // The whole design claim, as an assertion: a station lights at the moment the
  // drawing front arrives at it. Not two sequences tuned to look aligned — one
  // derived from the other.
  it("lights each station exactly as the drawing front reaches it", () => {
    for (let index = 0; index < STAGES; index += 1) {
      const { start } = stationReveal(index, STAGES)!;
      expect(drawExtent(start)).toBeCloseTo(stationPosition(index, STAGES)!, 5);
    }
  });

  it("lights the first station as the line starts drawing", () => {
    expect(stationReveal(0, STAGES)!.start).toBeCloseTo(DRAW_LEAD, 5);
  });

  it("reveals in reading order", () => {
    const starts = [0, 1, 2, 3].map((index) => stationReveal(index, STAGES)!.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("gives every station the same time to arrive", () => {
    [0, 1, 2, 3].forEach((index) => {
      const { start, end } = stationReveal(index, STAGES)!;
      expect(end - start).toBeCloseTo(STATION_REVEAL, 5);
    });
  });

  it("finishes the last station before the scroll runs out", () => {
    expect(stationReveal(STAGES - 1, STAGES)!.end).toBeLessThan(1);
  });

  it("has no window for a station outside the set", () => {
    expect(stationReveal(STAGES, STAGES)).toBeNull();
    expect(stationReveal(-1, STAGES)).toBeNull();
    expect(stationReveal(0, 0)).toBeNull();
  });
});
