import { describe, expect, it } from "vitest";
import {
  MORPH_DURATION_S,
  REDUCED_MOTION_FADE_S,
  ROTATE_INTERVAL_MS,
  SLIDE_DURATION_S,
  settleTimeS,
} from "@/lib/motion/rotator-timing";

describe("settleTimeS", () => {
  it("reports the still time between transitions", () => {
    expect(settleTimeS(3000, 0.9)).toBeCloseTo(2.1);
  });

  it("goes negative when a transition outlasts its interval", () => {
    expect(settleTimeS(400, 0.9)).toBeLessThan(0);
  });
});

describe("rotator timing constants", () => {
  it("leaves each state visibly still before the next transition", () => {
    // The defect in the previous 1500ms/0.45s pairing was not that it overlapped,
    // but that ~1s of stillness reads as frantic at hero scale.
    expect(settleTimeS()).toBeGreaterThanOrEqual(1.5);
  });

  it("keeps the pill and the creative on one shared duration", () => {
    expect(SLIDE_DURATION_S).toBe(MORPH_DURATION_S);
  });

  it("stays inside the slow band motion-system.md allows for hero motion", () => {
    expect(MORPH_DURATION_S).toBeGreaterThanOrEqual(0.8);
    expect(MORPH_DURATION_S).toBeLessThanOrEqual(1.5);
  });

  it("uses a fast reduced-motion crossfade", () => {
    // motion-system.md "Fast" band: 0.2s–0.4s.
    expect(REDUCED_MOTION_FADE_S).toBeGreaterThanOrEqual(0.2);
    expect(REDUCED_MOTION_FADE_S).toBeLessThanOrEqual(0.4);
  });

  it("holds each word long enough to be read", () => {
    expect(ROTATE_INTERVAL_MS).toBeGreaterThanOrEqual(2500);
  });
});
