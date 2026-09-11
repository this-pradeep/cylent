import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "@/lib/color/contrast";

describe("contrastRatio", () => {
  it("returns WCAG's fixed endpoints", () => {
    // Black on white is 21:1 and a colour on itself is 1:1. Both are defined by the spec
    // rather than by this implementation, which is what makes them worth asserting.
    expect(contrastRatio(parseHex("#ffffff"), parseHex("#000000"))).toBeCloseTo(21, 2);
    expect(contrastRatio(parseHex("#6853d4"), parseHex("#6853d4"))).toBeCloseTo(1, 6);
  });

  it("does not care which colour is given first", () => {
    const a = parseHex("#14120f");
    const b = parseHex("#faf9f7");

    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 9);
  });

  it("clears AA for the brand's own body text", () => {
    // design-principles.md sets --color-ink as the text colour on --color-surface, so this
    // pairing has to pass AA or the site's own palette does not.
    expect(contrastRatio(parseHex("#14120f"), parseHex("#faf9f7"))).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

describe("parseHex", () => {
  it("reads a six-digit hex into unit floats", () => {
    expect(parseHex("#ffffff")).toEqual([1, 1, 1]);
    expect(parseHex("#000000")).toEqual([0, 0, 0]);
  });

  it("accepts a hex with no leading hash", () => {
    expect(parseHex("faf9f7")).toEqual(parseHex("#faf9f7"));
  });
});
