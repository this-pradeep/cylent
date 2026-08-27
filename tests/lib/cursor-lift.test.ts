import { describe, expect, it } from "vitest";
import {
  LIFT_EASE,
  LIFT_RADIUS_PX,
  LIFT_RISE_PX,
  LIFT_TILT_DEG,
  liftStrength,
  liftTransform,
  stepToward,
} from "@/lib/motion/cursor-lift";

describe("liftStrength", () => {
  it("is full under the pointer", () => {
    expect(liftStrength(0)).toBe(1);
  });

  it("is nothing at the edge of reach, and stays nothing beyond it", () => {
    expect(liftStrength(LIFT_RADIUS_PX)).toBe(0);
    expect(liftStrength(LIFT_RADIUS_PX * 3)).toBe(0);
  });

  it("ignores which side the letter is on", () => {
    expect(liftStrength(-40)).toBeCloseTo(liftStrength(40), 10);
  });

  it("eases in and out rather than ramping — half way is half height", () => {
    // Smoothstep, so the midpoint is 0.5 but the ends are flat, and a letter drifts into
    // range instead of snapping the instant it crosses the radius.
    expect(liftStrength(LIFT_RADIUS_PX / 2)).toBeCloseTo(0.5, 10);
    expect(liftStrength(LIFT_RADIUS_PX * 0.95)).toBeLessThan(0.05);
    expect(liftStrength(LIFT_RADIUS_PX * 0.05)).toBeGreaterThan(0.95);
  });

  it("never strengthens as the pointer moves away", () => {
    let previous = Infinity;
    for (let d = 0; d <= LIFT_RADIUS_PX * 1.5; d += 2) {
      const strength = liftStrength(d);
      expect(strength).toBeLessThanOrEqual(previous + 1e-12);
      previous = strength;
    }
  });

  it("stays inside 0 and 1 everywhere", () => {
    for (let d = -300; d <= 300; d += 7) {
      expect(liftStrength(d)).toBeGreaterThanOrEqual(0);
      expect(liftStrength(d)).toBeLessThanOrEqual(1);
    }
  });

  it("collapses to nothing rather than dividing by zero on an unmeasured line", () => {
    expect(liftStrength(0, 0)).toBe(0);
    expect(liftStrength(50, 0)).toBe(0);
  });
});

describe("liftTransform", () => {
  it("sits still at rest", () => {
    expect(liftTransform(0, 1)).toEqual({ y: 0, rotate: 0 });
  });

  it("rises to its full height under the pointer", () => {
    expect(liftTransform(1, 0).y).toBeCloseTo(-LIFT_RISE_PX, 10);
  });

  it("rises, never sinks", () => {
    for (const p of [0.1, 0.4, 0.9, 1]) {
      expect(liftTransform(p, 1).y).toBeLessThan(0);
    }
  });

  it("tilts away from the pointer, so the two sides lean apart", () => {
    expect(liftTransform(1, 1).rotate).toBeCloseTo(LIFT_TILT_DEG, 10);
    expect(liftTransform(1, -1).rotate).toBeCloseTo(-LIFT_TILT_DEG, 10);
  });

  it("keeps the letter directly under the pointer upright", () => {
    expect(liftTransform(1, 0).rotate).toBe(0);
  });
});

describe("stepToward", () => {
  it("moves a fraction of the remaining distance", () => {
    expect(stepToward(0, 1)).toBeCloseTo(LIFT_EASE, 10);
  });

  it("never overshoots the target", () => {
    let current = 0;
    for (let i = 0; i < 500; i += 1) current = stepToward(current, 1);
    expect(current).toBeLessThanOrEqual(1);
    expect(current).toBeCloseTo(1, 6);
  });

  it("settles back to rest from any height", () => {
    let current = 1;
    for (let i = 0; i < 500; i += 1) current = stepToward(current, 0);
    expect(current).toBeCloseTo(0, 6);
  });

  it("stays put when it is already there", () => {
    expect(stepToward(0.5, 0.5)).toBe(0.5);
  });
});
