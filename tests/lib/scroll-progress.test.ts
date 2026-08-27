import { describe, expect, it } from "vitest";
import { clampProgress } from "@/lib/motion/scroll-progress";

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
