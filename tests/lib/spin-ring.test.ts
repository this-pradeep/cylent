import { describe, expect, it } from "vitest";
import { ringCircumference, ringLabel, ringPath } from "@/lib/motion/spin-ring";

describe("ringCircumference", () => {
  it("is the circumference of the text circle", () => {
    expect(ringCircumference(57)).toBeCloseTo(358.14, 2);
    expect(ringCircumference(10)).toBeCloseTo(62.83, 2);
  });

  it("is zero for a degenerate ring", () => {
    expect(ringCircumference(0)).toBe(0);
  });
});

describe("ringPath", () => {
  it("draws a closed circle of the given radius about the given centre", () => {
    // Two arcs of 180° each, because a single elliptical arc cannot close on itself.
    expect(ringPath(57, 76)).toBe("M76,76 m-57,0 a57,57 0 1,1 114,0 a57,57 0 1,1 -114,0");
  });

  it("scales the sweep with the radius", () => {
    expect(ringPath(20, 25)).toBe("M25,25 m-20,0 a20,20 0 1,1 40,0 a20,20 0 1,1 -40,0");
  });

  it("centres on the radius when no centre is given", () => {
    expect(ringPath(30)).toBe("M30,30 m-30,0 a30,30 0 1,1 60,0 a30,30 0 1,1 -60,0");
  });
});

describe("ringLabel", () => {
  it("ends with a separator so the loop closes seamlessly", () => {
    // Without a trailing separator the last and first words collide at the seam.
    expect(ringLabel("Start a conversation", 2)).toBe(
      "Start a conversation · Start a conversation · ",
    );
  });

  it("repeats the label the requested number of times", () => {
    expect(ringLabel("Go", 3)).toBe("Go · Go · Go · ");
    expect(ringLabel("Go", 1)).toBe("Go · ");
  });

  it("never produces an empty ring for a non-positive count", () => {
    expect(ringLabel("Go", 0)).toBe("Go · ");
    expect(ringLabel("Go", -4)).toBe("Go · ");
  });
});
