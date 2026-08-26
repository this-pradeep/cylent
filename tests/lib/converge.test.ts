import { describe, expect, it } from "vitest";
import { CRAFT_STEP_PX, convergeOffsets } from "@/lib/motion/converge";

const STEP = 60;

describe("convergeOffsets", () => {
  it("returns one offset per line", () => {
    expect(convergeOffsets(4, STEP)).toHaveLength(4);
  });

  it("sends every line to the same baseline", () => {
    // A line sits at index * step; adding its offset must land them all together.
    const offsets = convergeOffsets(4, STEP);
    const landings = offsets.map((offset, index) => index * STEP + offset);
    expect(new Set(landings.map((y) => y.toFixed(5))).size).toBe(1);
  });

  it("is symmetric about the centre, so the group does not drift", () => {
    const offsets = convergeOffsets(4, STEP);
    const sum = offsets.reduce((total, offset) => total + offset, 0);
    expect(sum).toBeCloseTo(0, 5);
    expect(offsets[0]).toBeCloseTo(-offsets[3], 5);
    expect(offsets[1]).toBeCloseTo(-offsets[2], 5);
  });

  it("moves the top line down and the bottom line up", () => {
    const offsets = convergeOffsets(4, STEP);
    expect(offsets[0]).toBeGreaterThan(0);
    expect(offsets[3]).toBeLessThan(0);
  });

  it("moves outer lines further than inner ones", () => {
    const offsets = convergeOffsets(4, STEP);
    expect(Math.abs(offsets[0])).toBeGreaterThan(Math.abs(offsets[1]));
    expect(offsets).toEqual([...offsets].sort((a, b) => b - a));
  });

  it("leaves the middle line of an odd stack where it is", () => {
    expect(convergeOffsets(5, STEP)[2]).toBe(0);
  });

  it("holds a single line still — there is nothing to converge on", () => {
    expect(convergeOffsets(1, STEP)).toEqual([0]);
  });

  it("returns nothing for an empty or negative stack", () => {
    expect(convergeOffsets(0, STEP)).toEqual([]);
    expect(convergeOffsets(-3, STEP)).toEqual([]);
  });

  it("collapses to no movement when the lines have no spacing yet", () => {
    // Guards the pre-measurement pass, where the list has not been laid out.
    expect(convergeOffsets(4, 0)).toEqual([0, 0, 0, 0]);
  });

  it("scales linearly with the measured step", () => {
    const single = convergeOffsets(4, STEP);
    const double = convergeOffsets(4, STEP * 2);
    single.forEach((offset, index) => {
      expect(double[index]).toBeCloseTo(offset * 2, 5);
    });
  });
});

describe("CRAFT_STEP_PX", () => {
  it("is a positive fallback for the pre-measurement pass", () => {
    expect(CRAFT_STEP_PX).toBeGreaterThan(0);
  });
});
