import { describe, expect, it } from "vitest";
import { PIN_DISABLE_BREAKPOINT_PX, shouldPinSection } from "@/lib/motion/breakpoint";

describe("shouldPinSection", () => {
  it("pins above the breakpoint with no reduced-motion preference", () => {
    expect(shouldPinSection(PIN_DISABLE_BREAKPOINT_PX, false)).toBe(true);
    expect(shouldPinSection(1440, false)).toBe(true);
  });

  it("does not pin below the breakpoint", () => {
    expect(shouldPinSection(PIN_DISABLE_BREAKPOINT_PX - 1, false)).toBe(false);
    expect(shouldPinSection(375, false)).toBe(false);
  });

  it("never pins when the user prefers reduced motion, regardless of width", () => {
    expect(shouldPinSection(1440, true)).toBe(false);
  });
});
