import { describe, expect, it } from "vitest";
import {
  LOADER_TRIAD,
  TRIAD_THRESHOLDS,
  greetingForHour,
  wordsRevealed,
} from "@/lib/motion/loader-copy";

describe("greetingForHour", () => {
  it("covers every hour of the day", () => {
    for (let hour = 0; hour < 24; hour++) {
      expect(greetingForHour(hour)).toMatch(/\S/);
    }
  });

  it("names the small hours rather than calling them morning", () => {
    expect(greetingForHour(0)).toBe("Still up.");
    expect(greetingForHour(4)).toBe("Still up.");
  });

  it("switches at the expected boundaries", () => {
    expect(greetingForHour(5)).toBe("Good morning.");
    expect(greetingForHour(11)).toBe("Good morning.");
    expect(greetingForHour(12)).toBe("Good afternoon.");
    expect(greetingForHour(16)).toBe("Good afternoon.");
    expect(greetingForHour(17)).toBe("Good evening.");
    expect(greetingForHour(21)).toBe("Good evening.");
    expect(greetingForHour(22)).toBe("Working late.");
    expect(greetingForHour(23)).toBe("Working late.");
  });
});

describe("wordsRevealed", () => {
  it("shows the first word immediately so the line is never empty", () => {
    expect(wordsRevealed(0)).toBe(1);
  });

  it("adds words as progress crosses each threshold", () => {
    expect(wordsRevealed(33)).toBe(1);
    expect(wordsRevealed(34)).toBe(2);
    expect(wordsRevealed(67)).toBe(2);
    expect(wordsRevealed(68)).toBe(3);
  });

  it("has revealed the whole triad by completion", () => {
    expect(wordsRevealed(100)).toBe(LOADER_TRIAD.length);
  });

  it("never reveals more words than there are", () => {
    expect(TRIAD_THRESHOLDS.length).toBe(LOADER_TRIAD.length);
    expect(wordsRevealed(1000)).toBe(LOADER_TRIAD.length);
  });

  it("keeps thresholds ordered and inside the progress range", () => {
    const ordered = [...TRIAD_THRESHOLDS].sort((a, b) => a - b);
    expect([...TRIAD_THRESHOLDS]).toEqual(ordered);
    expect(TRIAD_THRESHOLDS[0]).toBeGreaterThanOrEqual(0);
    expect(TRIAD_THRESHOLDS[TRIAD_THRESHOLDS.length - 1]).toBeLessThan(100);
  });
});
