import { describe, expect, it } from "vitest";
import {
  ABSORB_END,
  ENTRY_END,
  absorptionCount,
  consumeWindow,
  remainingAt,
} from "@/lib/motion/converge";

const CRAFTS = 4;

describe("absorptionCount", () => {
  it("absorbs every line but the one they all end up as", () => {
    expect(absorptionCount(4)).toBe(3);
    expect(absorptionCount(1)).toBe(0);
  });

  it("has nothing to absorb in an empty stack", () => {
    expect(absorptionCount(0)).toBe(0);
    expect(absorptionCount(-2)).toBe(0);
  });
});

describe("consumeWindow", () => {
  it("never consumes the first line — it is what the others become", () => {
    expect(consumeWindow(0, CRAFTS)).toBeNull();
  });

  it("consumes from the bottom up, so the list shortens from its end", () => {
    const last = consumeWindow(3, CRAFTS)!;
    const middle = consumeWindow(2, CRAFTS)!;
    const first = consumeWindow(1, CRAFTS)!;
    expect(last.start).toBeLessThan(middle.start);
    expect(middle.start).toBeLessThan(first.start);
  });

  it("starts absorbing only once the lines have finished arriving", () => {
    expect(consumeWindow(3, CRAFTS)!.start).toBeCloseTo(ENTRY_END, 5);
  });

  it("finishes the last absorption exactly as the resolve begins", () => {
    expect(consumeWindow(1, CRAFTS)!.end).toBeCloseTo(ABSORB_END, 5);
  });

  it("gives every line an equal share of the absorption phase", () => {
    const spans = [1, 2, 3].map((index) => {
      const window = consumeWindow(index, CRAFTS)!;
      return window.end - window.start;
    });
    expect(spans[0]).toBeCloseTo(spans[1], 5);
    expect(spans[1]).toBeCloseTo(spans[2], 5);
  });

  it("hands off without gaps or overlap — one line at a time", () => {
    expect(consumeWindow(3, CRAFTS)!.end).toBeCloseTo(consumeWindow(2, CRAFTS)!.start, 5);
    expect(consumeWindow(2, CRAFTS)!.end).toBeCloseTo(consumeWindow(1, CRAFTS)!.start, 5);
  });

  it("has no window for a line that does not exist", () => {
    expect(consumeWindow(4, CRAFTS)).toBeNull();
    expect(consumeWindow(-1, CRAFTS)).toBeNull();
  });

  it("has nothing to consume in a single-line stack", () => {
    expect(consumeWindow(0, 1)).toBeNull();
  });
});

describe("remainingAt", () => {
  it("shows the full count until the absorption starts", () => {
    expect(remainingAt(0, CRAFTS)).toBe(CRAFTS);
    expect(remainingAt(ENTRY_END, CRAFTS)).toBe(CRAFTS);
  });

  it("ticks down only once a line is fully consumed, not as it starts", () => {
    const window = consumeWindow(3, CRAFTS)!;
    const midway = (window.start + window.end) / 2;
    expect(remainingAt(midway, CRAFTS)).toBe(CRAFTS);
    expect(remainingAt(window.end + 1e-6, CRAFTS)).toBe(CRAFTS - 1);
  });

  it("counts down one per absorption, in order", () => {
    expect(remainingAt(consumeWindow(3, CRAFTS)!.end + 1e-6, CRAFTS)).toBe(3);
    expect(remainingAt(consumeWindow(2, CRAFTS)!.end + 1e-6, CRAFTS)).toBe(2);
    expect(remainingAt(consumeWindow(1, CRAFTS)!.end - 1e-6, CRAFTS)).toBe(2);
  });

  it("lands on one and stays there — the studio, not a craft", () => {
    expect(remainingAt(ABSORB_END, CRAFTS)).toBe(1);
    expect(remainingAt(1, CRAFTS)).toBe(1);
  });

  it("never overshoots in either direction across the whole scrub", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const remaining = remainingAt(p, CRAFTS);
      expect(remaining).toBeGreaterThanOrEqual(1);
      expect(remaining).toBeLessThanOrEqual(CRAFTS);
      expect(Number.isInteger(remaining)).toBe(true);
    }
  });

  it("never counts back up as the scrub advances", () => {
    let previous = CRAFTS;
    for (let p = 0; p <= 1; p += 0.005) {
      const remaining = remainingAt(p, CRAFTS);
      expect(remaining).toBeLessThanOrEqual(previous);
      previous = remaining;
    }
  });

  it("clamps a scrub that runs past its own range", () => {
    expect(remainingAt(-5, CRAFTS)).toBe(CRAFTS);
    expect(remainingAt(5, CRAFTS)).toBe(1);
  });

  it("holds at one for a stack that has nothing to absorb", () => {
    expect(remainingAt(0, 1)).toBe(1);
    expect(remainingAt(1, 1)).toBe(1);
  });
});
