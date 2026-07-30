import { describe, expect, it } from "vitest";
import { clampProgress, mapScrollToStep } from "@/lib/motion/scroll-progress";

describe("clampProgress", () => {
  it("clamps values below 0 to 0", () => {
    expect(clampProgress(-0.5)).toBe(0);
  });

  it("clamps values above 1 to 1", () => {
    expect(clampProgress(1.5)).toBe(1);
  });

  it("passes through in-range values unchanged", () => {
    expect(clampProgress(0.42)).toBe(0.42);
  });
});

describe("mapScrollToStep", () => {
  it("maps progress 0 to step 0", () => {
    expect(mapScrollToStep(0, 5)).toBe(0);
  });

  it("maps progress 1 to the last step, not stepCount", () => {
    expect(mapScrollToStep(1, 5)).toBe(4);
  });

  it("maps mid-range progress proportionally", () => {
    expect(mapScrollToStep(0.5, 5)).toBe(2);
  });

  it("clamps out-of-range progress before mapping", () => {
    expect(mapScrollToStep(-1, 5)).toBe(0);
    expect(mapScrollToStep(2, 5)).toBe(4);
  });
});
