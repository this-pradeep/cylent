import { describe, expect, it } from "vitest";
import {
  PROCESS_EYEBROW,
  PROCESS_HEADING,
  PROCESS_STAGES,
  PROCESS_SUBHEAD,
} from "@/lib/site/process";

describe("PROCESS_STAGES", () => {
  it("runs the four stages the story document names", () => {
    expect(PROCESS_STAGES.map((stage) => stage.name)).toEqual([
      "Discover",
      "Design",
      "Build",
      "Deliver",
    ]);
  });

  it("numbers them in order, zero-padded, so the column reads as a set", () => {
    expect(PROCESS_STAGES.map((stage) => stage.number)).toEqual(["01", "02", "03", "04"]);
  });

  // The copy is the studio's to replace. This is what stops a replacement leaving a
  // station rendering as an empty column.
  it("gives every stage something to say", () => {
    PROCESS_STAGES.forEach((stage) => {
      expect(stage.name.trim()).not.toBe("");
      expect(stage.line.trim()).not.toBe("");
    });
  });

  it("heads the section", () => {
    expect(PROCESS_EYEBROW.trim()).not.toBe("");
    expect(PROCESS_HEADING.trim()).not.toBe("");
    expect(PROCESS_SUBHEAD.trim()).not.toBe("");
  });
});
