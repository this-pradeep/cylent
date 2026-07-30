import { describe, expect, it } from "vitest";
import { getMotionMode } from "@/lib/motion/reduced-motion";

describe("getMotionMode", () => {
  it("returns 'reduced' when the user prefers reduced motion", () => {
    expect(getMotionMode(true)).toBe("reduced");
  });

  it("returns 'full' when the user has no motion preference", () => {
    expect(getMotionMode(false)).toBe("full");
  });
});
