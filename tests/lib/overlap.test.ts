import { describe, expect, it } from "vitest";
import {
  FIELD_COUNT,
  FIELD_FOCUS,
  FIELD_RESTS,
  fieldPosition,
  fieldSpread,
} from "@/lib/motion/overlap";

describe("field tables", () => {
  it("describes the same three fields at rest and gathered", () => {
    expect(FIELD_RESTS).toHaveLength(FIELD_COUNT);
    expect(FIELD_FOCUS).toHaveLength(FIELD_COUNT);
    expect(FIELD_COUNT).toBe(3);
  });

  it("starts them apart — no two fields share a resting place", () => {
    const seen = new Set(FIELD_RESTS.map(({ x, y }) => `${x},${y}`));
    expect(seen.size).toBe(FIELD_COUNT);
  });
});

describe("fieldPosition", () => {
  it("sits at rest before the gather begins", () => {
    FIELD_RESTS.forEach((rest, index) => {
      expect(fieldPosition(index, 0)).toEqual(rest);
    });
  });

  it("arrives at the gathered position", () => {
    FIELD_FOCUS.forEach((focus, index) => {
      const position = fieldPosition(index, 1);
      expect(position.x).toBeCloseTo(focus.x, 5);
      expect(position.y).toBeCloseTo(focus.y, 5);
    });
  });

  it("interpolates evenly, so a scrub reads as one continuous drift", () => {
    const half = fieldPosition(0, 0.5);
    expect(half.x).toBeCloseTo((FIELD_RESTS[0].x + FIELD_FOCUS[0].x) / 2, 5);
    expect(half.y).toBeCloseTo((FIELD_RESTS[0].y + FIELD_FOCUS[0].y) / 2, 5);
  });

  it("clamps a scrub that runs past either end", () => {
    expect(fieldPosition(0, -3)).toEqual(FIELD_RESTS[0]);
    expect(fieldPosition(0, 4).x).toBeCloseTo(FIELD_FOCUS[0].x, 5);
  });

  it("holds still for a field that does not exist", () => {
    expect(fieldPosition(FIELD_COUNT, 0.5)).toEqual({ x: 0, y: 0 });
    expect(fieldPosition(-1, 0.5)).toEqual({ x: 0, y: 0 });
  });
});

describe("fieldSpread", () => {
  it("closes as the fields gather", () => {
    expect(fieldSpread(1)).toBeLessThan(fieldSpread(0));
  });

  it("never closes completely — three fields stacked exactly are one field, and the\n     overlap is the entire argument", () => {
    expect(fieldSpread(1)).toBeGreaterThan(0);
  });

  it("tightens the whole way, never loosening mid-scrub", () => {
    let previous = Infinity;
    for (let p = 0; p <= 1; p += 0.02) {
      const spread = fieldSpread(p);
      expect(spread).toBeLessThanOrEqual(previous + 1e-9);
      previous = spread;
    }
  });

  it("keeps them close enough at the end to actually intersect", () => {
    // The radial falloff reaches transparent at 72% of the field's half-width, so the
    // visible pool is 72 across in these units. Any two centres further apart than that
    // leave separate pools and no intersection to sit in.
    expect(fieldSpread(1)).toBeLessThan(72);
  });
});
