import { describe, expect, it } from "vitest";
import {
  CARD_TILTS_DEG,
  arrivalProgress,
  cardTransform,
  isFrontCard,
} from "@/lib/motion/draft-stack";

const VH = 1000;
const OFFSET = 2400;

describe("arrivalProgress", () => {
  it("is 0 while the card has not begun entering", () => {
    expect(arrivalProgress(0, OFFSET, VH)).toBe(0);
    expect(arrivalProgress(OFFSET - VH, OFFSET, VH)).toBe(0);
  });

  it("reaches 1 once the card has travelled its entrance span", () => {
    // entrance begins at offset - 0.88vh and spans 0.46vh
    const start = OFFSET - VH * 0.88;
    expect(arrivalProgress(start + VH * 0.46, OFFSET, VH)).toBeCloseTo(1, 5);
  });

  it("is half way through the entrance at half the span", () => {
    const start = OFFSET - VH * 0.88;
    expect(arrivalProgress(start + VH * 0.23, OFFSET, VH)).toBeCloseTo(0.5, 5);
  });

  it("clamps rather than overshooting once the card is long past", () => {
    expect(arrivalProgress(OFFSET + VH * 10, OFFSET, VH)).toBe(1);
  });

  it("never returns a negative value for cards far below the viewport", () => {
    expect(arrivalProgress(0, OFFSET * 4, VH)).toBe(0);
  });
});

describe("isFrontCard", () => {
  it("is front once arrived and not yet overlapped", () => {
    expect(isFrontCard(1, 0)).toBe(true);
  });

  it("is not front while still entering", () => {
    expect(isFrontCard(0.4, 0)).toBe(false);
  });

  it("is not front once the next card has begun covering it", () => {
    expect(isFrontCard(1, 0.4)).toBe(false);
  });

  it("selects at most one card across a monotonically non-increasing stack", () => {
    // arrivals always decrease with index: a later card cannot have arrived more
    const stacks = [
      [1, 1, 1],
      [1, 1, 0.6],
      [1, 0.8, 0.1],
      [1, 0.3, 0],
      [1, 0, 0],
      [0.6, 0, 0],
      [0, 0, 0],
      [1, 0.55, 0.25],
      [1, 0.25, 0.24],
    ];

    for (const arrivals of stacks) {
      const fronts = arrivals.filter((arrival, index) =>
        isFrontCard(arrival, arrivals[index + 1] ?? 0),
      );
      expect(fronts.length).toBeLessThanOrEqual(1);
    }
  });
});

describe("cardTransform", () => {
  it("starts lifted, tilted, small and faint", () => {
    const t = cardTransform(0, 0, -0.75, VH);
    expect(t.y).toBeCloseTo(VH * 0.09, 5);
    expect(t.rotate).toBeCloseTo(-0.75, 5);
    expect(t.scale).toBeCloseTo(0.97, 5);
    expect(t.opacity).toBeCloseTo(0.2, 5);
    expect(t.bodyOpacity).toBeCloseTo(1, 5);
  });

  it("settles level, square and opaque once arrived and uncovered", () => {
    const t = cardTransform(1, 0, -0.75, VH);
    expect(t.y).toBeCloseTo(0, 5);
    expect(t.rotate).toBeCloseTo(0, 5);
    expect(t.scale).toBeCloseTo(1, 5);
    expect(t.opacity).toBeCloseTo(1, 5);
  });

  it("recedes as the next card covers it", () => {
    const open = cardTransform(1, 0, 0.55, VH);
    const covered = cardTransform(1, 1, 0.55, VH);
    expect(covered.scale).toBeLessThan(open.scale);
    expect(covered.bodyOpacity).toBeLessThan(open.bodyOpacity);
    expect(covered.bodyOpacity).toBeCloseTo(0.28, 5);
  });

  it("keeps opacity within bounds at the extremes", () => {
    for (const arrival of [0, 0.25, 0.5, 0.75, 1]) {
      const t = cardTransform(arrival, 0, 0, VH);
      expect(t.opacity).toBeGreaterThanOrEqual(0);
      expect(t.opacity).toBeLessThanOrEqual(1);
    }
  });
});

describe("CARD_TILTS_DEG", () => {
  it("gives each of the three drafts a distinct lean so the pile reads as paper", () => {
    expect(CARD_TILTS_DEG).toHaveLength(3);
    expect(new Set(CARD_TILTS_DEG).size).toBe(3);
    // alternating directions, none of them level
    expect(CARD_TILTS_DEG.every((tilt) => tilt !== 0)).toBe(true);
  });
});
