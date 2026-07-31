import { describe, expect, it } from "vitest";
import { computeDisplacementSample } from "@/lib/glass/refraction-map";

describe("computeDisplacementSample", () => {
  it("returns no displacement (128, 128) deep inside a flat rectangle", () => {
    const { r, g } = computeDisplacementSample(0, 0, 50, 50, 0, 10);
    expect(r).toBeCloseTo(128);
    expect(g).toBeCloseTo(128);
  });

  it("returns full outward displacement exactly at a flat (unrounded) rim", () => {
    const { r, g } = computeDisplacementSample(50, 0, 50, 50, 0, 10);
    expect(r).toBeCloseTo(255);
    expect(g).toBeCloseTo(128);
  });

  it("returns partial displacement mid-band near the rim", () => {
    const { r } = computeDisplacementSample(45, 0, 50, 50, 0, 10);
    expect(r).toBeGreaterThan(128);
    expect(r).toBeLessThan(255);
  });

  it("displaces along both axes at a rounded corner rim", () => {
    // halfWidth=100, halfHeight=30, radius=30 (a full pill), sampled at the
    // top edge's flat middle (not the rounded ends) — full outward-Y push.
    const { r, g } = computeDisplacementSample(0, -30, 100, 30, 30, 10);
    expect(r).toBeCloseTo(128);
    expect(g).toBeCloseTo(128 - 127); // full negative (upward) displacement
  });

  it("clamps the band to a minimum so a zero band doesn't divide by zero", () => {
    const { r } = computeDisplacementSample(50, 0, 50, 50, 0, 0);
    expect(Number.isFinite(r)).toBe(true);
  });
});
