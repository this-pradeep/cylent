import { describe, expect, it } from "vitest";
import { getCondenseProgress } from "@/lib/motion/nav-scroll";

describe("getCondenseProgress", () => {
  it("returns 0 at the top of the page", () => {
    expect(getCondenseProgress(0, 24)).toBe(0);
  });

  it("returns 1 once scroll passes the threshold", () => {
    expect(getCondenseProgress(24, 24)).toBe(1);
    expect(getCondenseProgress(100, 24)).toBe(1);
  });

  it("returns a proportional value mid-threshold", () => {
    expect(getCondenseProgress(12, 24)).toBe(0.5);
  });

  it("treats a zero or negative threshold as fully condensed", () => {
    expect(getCondenseProgress(0, 0)).toBe(1);
  });
});
